/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Response, Request } from "express"
import { MessageSender } from "@prisma/client"
import { CareerUUID, ErrorResponse, StartChatSuccess } from "@bluedotrobots/common-ts"
import StreamManager from "../../classes/stream-manager"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import addCareerMessage from "../../db-operations/write/career-message/add-career-message"
import buildCareerChatLLMContext from "../../utils/llm/career-quest/build-career-chat-llm-context"

export default function sendCareerMessage(req: Request, res: Response): void {
	try {
		const { userId } = req
		const { careerUUID } = req.params as { careerUUID: CareerUUID }
		const chatData = req.body as ProcessedCareerChatData

		// Create a new stream and get streamId
		const { streamId, abortController } = StreamManager.getInstance().createStream()

		// Immediately respond with streamId so client can use it to stop if needed
		res.status(200).json({ streamId } satisfies StartChatSuccess)

		// Process LLM request with streaming via WebSocket (async)
		void processLLMRequest(chatData, userId, careerUUID, streamId, abortController.signal)
	} catch (error) {
		console.error("Chatbot endpoint error:", error)
		res.status(500).json({
			error: "Internal Server Error: Unable to process career chat request"
		} satisfies ErrorResponse)
	}
}

// eslint-disable-next-line max-lines-per-function, complexity
async function processLLMRequest(
	chatData: ProcessedCareerChatData,
	userId: number,
	careerUUID: CareerUUID,
	streamId: string,
	abortSignal: AbortSignal
): Promise<void> {
	const socketManager = BrowserSocketManager.getInstance()

	try {
		if (abortSignal.aborted) return

		await addCareerMessage(
			chatData.careerChatId,
			chatData.message,
			MessageSender.USER
		)

		const messages = buildCareerChatLLMContext(chatData)
		const modelId = selectModel("generalQuestion")

		socketManager.emitCareerChatbotStart(userId, {
			careerUUID,
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
				socketManager.emitCareerChatbotChunk(userId, {
					careerUUID,
					content
				})
			}
		}

		// Only save and send completion if not aborted
		if (!abortSignal.aborted && aiResponseContent.trim()) {
			await addCareerMessage(
				chatData.careerChatId,
				aiResponseContent,
				MessageSender.AI,
				modelId
			)

			socketManager.emitCareerChatbotComplete(userId, {
				careerUUID,
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
