/* eslint-disable max-depth */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Response, Request } from "express"
import { MessageSender } from "@prisma/client"
import { ErrorResponse, StartChatSuccess } from "@bluedotrobots/common-ts"
import StreamManager from "../../classes/stream-manager"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import buildCqLLMContext from "../../utils/llm/career-quest/build-cq-llm-context"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import addCareerQuestMessage from "../../db-operations/write/career-quest-message/add-career-quest-message"

export default function sendCareerQuestMessage(req: Request, res: Response): void {
	try {
		const { userId } = req
		const chatData = req.body as ProcessedCareerQuestChatData

		// Create a new stream and get streamId
		const { streamId, abortController } = StreamManager.getInstance().createStream()

		// Immediately respond with streamId so client can use it to stop if needed
		res.status(200).json({ streamId } satisfies StartChatSuccess)

		// Process LLM request with streaming via WebSocket (async)
		void processLLMRequest(chatData, userId, streamId, abortController.signal)
	} catch (error) {
		console.error("Chatbot endpoint error:", error)
		res.status(500).json({
			error: "Internal Server Error: Unable to process chatbot request"
		} satisfies ErrorResponse)
	}
}

// eslint-disable-next-line max-lines-per-function, complexity
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

		await addCareerQuestMessage(
			chatData.careerQuestChatId,
			chatData.message,
			MessageSender.USER
		)

		// Build LLM context
		const messages = buildCqLLMContext(chatData)

		// Select model based on interaction type
		const modelId = selectModel("generalQuestion")

		// Send start event with challengeId
		socketManager.emitCqChatbotStart(userId, {
			challengeId: chatData.careerQuestChallengeId,
			interactionType: "generalQuestion"
		})

		// Check abort before making OpenAI call
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
			temperature: 0.5,              // Lower than sandbox (0.6) for more focused, goal-oriented responses
			max_completion_tokens: 1800,   // Higher than sandbox for detailed code analysis
			presence_penalty: 0.2,         // Lower - want to stay focused on challenge objectives
			frequency_penalty: 0.3,        // Same as sandbox
		}, {
			signal: abortSignal
		})

		let aiResponseContent = "" // Collect full AI response

		try {
			// Stream chunks back via WebSocket with challengeId
			for await (const chunk of stream) {
				if (abortSignal.aborted) break

				const content = chunk.choices[0]?.delta?.content
				if (content) {
					aiResponseContent += content // Collect the content
					socketManager.emitCqChatbotChunk(userId, content, chatData.careerQuestChallengeId)
				}
			}

			// Only save and send completion if not aborted
			if (!abortSignal.aborted && aiResponseContent.trim()) {
				// Save AI response to database
				await addCareerQuestMessage(
					chatData.careerQuestChatId,
					aiResponseContent,
					MessageSender.AI,
					modelId
				)

				socketManager.emitCqChatbotComplete(userId, chatData.careerQuestChallengeId)
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
