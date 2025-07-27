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
		if (abortSignal.aborted) return

		await addCareerQuestMessage(
			chatData.careerQuestChatId,
			chatData.message,
			MessageSender.USER
		)

		const messages = buildCqLLMContext(chatData)
		const modelId = selectModel("generalQuestion")

		socketManager.emitCqChatbotStart(userId, {
			careerId: chatData.careerId,
			challengeId: chatData.challengeId,
			interactionType: "generalQuestion"
		})

		if (abortSignal.aborted) return

		const openAiClient = await OpenAiClientClass.getOpenAiClient()
		const stream = await openAiClient.chat.completions.create({
			model: modelId,
			messages: messages.map(msg => ({
				role: msg.role,
				content: msg.content
			})),
			stream: true,
			temperature: 0.5,
			max_completion_tokens: 1800,
			presence_penalty: 0.2,
			frequency_penalty: 0.3,
		}, {
			signal: abortSignal
		})

		let aiResponseContent = ""

		// Stream chunks back via WebSocket
		for await (const chunk of stream) {
			if (abortSignal.aborted) break

			const content = chunk.choices[0]?.delta?.content
			if (content) {
				aiResponseContent += content
				socketManager.emitCqChatbotChunk(userId, {
					careerId: chatData.careerId,
					challengeId: chatData.challengeId,
					content
				})
			}
		}

		// Only save and send completion if not aborted
		if (!abortSignal.aborted && aiResponseContent.trim()) {
			await addCareerQuestMessage(
				chatData.careerQuestChatId,
				aiResponseContent,
				MessageSender.AI,
				modelId
			)

			socketManager.emitCqChatbotComplete(userId, {
				careerId: chatData.careerId,
				challengeId: chatData.challengeId
			})
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
