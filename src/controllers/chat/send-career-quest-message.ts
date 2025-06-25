/* eslint-disable max-depth */
import { Response, Request } from "express"
import { ErrorResponse, IncomingChatData, StartChatSuccess } from "@bluedotrobots/common-ts"
import StreamManager from "../../classes/stream-manager"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import { buildLLMContext } from "../../utils/llm/build-llm-context"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default function sendCareerQuestMessage(req: Request, res: Response): void {
	try {
		const { userId } = req
		const chatData = req.body as IncomingChatData

		// Create a new stream and get streamId
		const { streamId, abortController } = StreamManager.getInstance().createStream()

		// Immediately respond with streamId so client can use it to stop if needed
		res.status(200).json({ streamId } as StartChatSuccess)

		// Process LLM request with streaming via WebSocket (async)
		processLLMRequest(chatData, userId, streamId, abortController.signal)
			.catch(error => {
				console.error("Background LLM processing error:", error)
			})

	} catch (error) {
		console.error("Chatbot endpoint error:", error)
		res.status(500).json({
			error: "Internal Server Error: Unable to process chatbot request"
		} as ErrorResponse)
	}
}

// eslint-disable-next-line complexity, max-lines-per-function
async function processLLMRequest(
	chatData: IncomingChatData,
	userId: number,
	streamId: string,
	abortSignal: AbortSignal
): Promise<void> {
	const socketManager = BrowserSocketManager.getInstance()
	const challengeId = chatData.challengeData.id

	try {
		// Check if already aborted
		if (abortSignal.aborted) return

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

		// Send start event with challengeId
		socketManager.emitChatbotStart(userId, chatData.interactionType, challengeId)

		// Check abort before making OpenAI call
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (abortSignal.aborted) return

		// Get OpenAI client and make streaming request with abort signal
		const openAiClient = await OpenAiClientClass.getOpenAiClient()
		const stream = await openAiClient.chat.completions.create({
			model: modelId,
			messages: messages.map(msg => ({
				role: msg.role,
				content: msg.content
			})),
			stream: true,
			temperature: 0.7,
			max_completion_tokens: 1000
		}, {
			signal: abortSignal // Pass abort signal to OpenAI request
		})

		let fullResponse = ""

		try {
			// Stream chunks back via WebSocket with challengeId
			for await (const chunk of stream) {
				// Check if aborted during streaming
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				if (abortSignal.aborted) break

				const content = chunk.choices[0]?.delta?.content
				if (content) {
					fullResponse += content
					socketManager.emitChatbotChunk(userId, content, chatData.interactionType, challengeId)
				}
			}

			// Only send completion if not aborted
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!abortSignal.aborted) {
				socketManager.emitChatbotComplete(userId, fullResponse, chatData.interactionType, challengeId)
			}

		} catch (error) {
			if (error instanceof Error && error.name === "AbortError") { // ✅ Properly typed
			} else {
				throw error
			}
		}

	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") { // ✅ Properly typed
		} else {
			console.error("LLM processing error:", error)
			// Only send error if not aborted
			if (!abortSignal.aborted) {
				// Could emit error via WebSocket here if needed
			}
		}
	} finally {
		// Clean up the stream
		StreamManager.getInstance().stopStream(streamId)
	}
}
