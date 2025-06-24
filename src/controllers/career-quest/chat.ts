import { Response, Request } from "express"
import { ErrorResponse, ChatMessageRole, IncomingChatData, InteractionType } from "@bluedotrobots/common-ts"
import { buildLLMContext } from "../../utils/llm/build-llm-context"
import OpenAiClientClass from "../../classes/openai-client"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default async function chatbotChat(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const chatData = req.body as IncomingChatData

		// Process LLM request with streaming via WebSocket
		await processLLMRequest(
			chatData,
			userId
		)

	} catch (error) {
		console.error("Chatbot endpoint error:", error)
		res.status(500).json({
			error: "Internal Server Error: Unable to process chatbot request"
		} as ErrorResponse)
	}
}

async function processLLMRequest(
	chatData: IncomingChatData,
	userId: number
): Promise<void> {
	const socketManager = BrowserSocketManager.getInstance()

	try {
		// Build LLM context
		const messages = buildLLMContext(
			chatData.challengeData,
			chatData.userCode,
			chatData.interactionType,
			chatData.conversationHistory,
			chatData.message,
		)

		// Select model based on interaction type
		const modelId = selectModel(chatData.interactionType)

		// Send start event
		socketManager.emitChatbotStart(userId, chatData.interactionType)

		// Get OpenAI client and make streaming request
		const openAiClient = await OpenAiClientClass.getOpenAiClient()
		const stream = await openAiClient.chat.completions.create({
			model: modelId,
			messages: messages.map(msg => ({
				role: msg.role as ChatMessageRole,
				content: msg.content
			})),
			stream: true,
			temperature: 0.7,
			max_tokens: 1000
		})

		let fullResponse = ""

		// Stream chunks back via WebSocket
		for await (const chunk of stream) {
			const content = chunk.choices[0]?.delta?.content
			if (content) {
				fullResponse += content
				socketManager.emitChatbotChunk(userId, content, chatData.interactionType)
			}
		}

		// Send completion event
		socketManager.emitChatbotComplete(userId, fullResponse, chatData.interactionType)

	} catch (error) {
		console.error("LLM processing error:", error)
		throw error
	}
}

function selectModel(interactionType: InteractionType): string {
	// You can customize this logic to use different models for different interaction types
	switch (interactionType) {
	case "checkCode":
		return "deepseek/deepseek-chat-v3-0324:free" // Good for code analysis
	case "hint":
		return "deepseek/deepseek-chat-v3-0324:free" // Fast and helpful
	case "generalQuestion":
		return "deepseek/deepseek-chat-v3-0324:free" // Good general knowledge
	default:
		return "deepseek/deepseek-chat-v3-0324:free"
	}
}
