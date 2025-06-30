
import { Response, Request } from "express"
import { MessageSender } from "@prisma/client"
import { ErrorResponse, ProcessedCareerQuestChatData, StartChatSuccess } from "@bluedotrobots/common-ts"
import StreamManager from "../../classes/stream-manager"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import { buildLLMContext } from "../../utils/llm/build-llm-context"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import findChallengeDataFromId from "../../utils/llm/find-challenge-data-from-id"
import { addCareerQuestMessage } from "../../db-operations/write/career-quest-message/add-career-quest-message"

export default function sendCareerQuestMessage(req: Request, res: Response): void {
	try {
		const { userId } = req
		const chatData = req.body as ProcessedCareerQuestChatData

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
	chatData: ProcessedCareerQuestChatData,
	userId: number,
	streamId: string,
	abortSignal: AbortSignal
): Promise<void> {
	const socketManager = BrowserSocketManager.getInstance()

	try {
		// Check if already aborted
		if (abortSignal.aborted) return

		// Save user message to database first
		let userMessage = ""
		if (chatData.interactionType === "generalQuestion" && chatData.message) {
			userMessage = chatData.message
		} else {
			// For other interaction types, create a descriptive message
			if (chatData.interactionType === "checkCode") {
				userMessage = `Check my code: ${chatData.userCode}`
			} else if (chatData.interactionType === "hint") {
				userMessage = "Give me a hint for this challenge"
			} else {
				userMessage = "User interaction"
			}
		}

		await addCareerQuestMessage(
			chatData.careerQuestChatId,
			userMessage,
			MessageSender.USER
		)

		// Build LLM context
		const messages = buildLLMContext(
			findChallengeDataFromId(chatData.careerQuestChallengeId),
			chatData.userCode,
			chatData.interactionType,
			chatData.conversationHistory,
			chatData.message,
		)

		// Select model based on interaction type
		const modelId = selectModel(chatData.interactionType)

		// Send start event with challengeId
		socketManager.emitChatbotStart(userId, chatData)

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
			signal: abortSignal
		})

		let aiResponseContent = "" // Collect full AI response

		try {
			// Stream chunks back via WebSocket with challengeId
			for await (const chunk of stream) {
				// Check if aborted during streaming
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				if (abortSignal.aborted) break

				const content = chunk.choices[0]?.delta?.content
				if (content) {
					aiResponseContent += content // Collect the content
					socketManager.emitChatbotChunk(userId, content, chatData.careerQuestChallengeId)
				}
			}

			// Only save and send completion if not aborted
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!abortSignal.aborted && aiResponseContent.trim()) {
				// Save AI response to database
				await addCareerQuestMessage(
					chatData.careerQuestChatId,
					aiResponseContent,
					MessageSender.AI,
					modelId
				)

				socketManager.emitChatbotComplete(userId, chatData.careerQuestChallengeId)
			}

		} catch (error) {
			if (error instanceof Error && error.name === "AbortError") {
				// If aborted during streaming, don't save partial response
			} else {
				throw error
			}
		}

	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			// Handle abort gracefully
		} else {
			console.error("LLM processing error:", error)
			if (!abortSignal.aborted) {
				// Could emit error via WebSocket here if needed
			}
		}
	} finally {
		// Clean up the stream
		StreamManager.getInstance().stopStream(streamId)
	}
}
