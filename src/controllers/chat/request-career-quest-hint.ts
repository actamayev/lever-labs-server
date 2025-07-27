/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Response, Request } from "express"
import { ErrorResponse, StartChatSuccess } from "@bluedotrobots/common-ts"
import StreamManager from "../../classes/stream-manager"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import buildHintLLMContext from "../../utils/llm/career-quest/build-hint-request-llm-context"
import getNextHintNumber from "../../db-operations/read/career-quest-hint/get-next-hint-number"
import addCareerQuestHint from "../../db-operations/write/career-quest-hint/add-career-quest-hint"

export default function requestCareerQuestHint(req: Request, res: Response): void {
	try {
		const { userId } = req
		const chatData = req.body as ProcessedCareerQuestHintMessage

		// Create a new stream and get streamId
		const { streamId, abortController } = StreamManager.getInstance().createStream()

		// Immediately respond with streamId so client can use it to stop if needed
		res.status(200).json({ streamId } satisfies StartChatSuccess)

		// Process hint request with streaming via WebSocket (async)
		void processHintRequest(chatData, userId, streamId, abortController.signal)
	} catch (error) {
		console.error("Hint request endpoint error:", error)
		res.status(500).json({
			error: "Internal Server Error: Unable to process hint request"
		} satisfies ErrorResponse)
	}
}

// eslint-disable-next-line max-lines-per-function, complexity
async function processHintRequest(
	chatData: ProcessedCareerQuestHintMessage,
	userId: number,
	streamId: string,
	abortSignal: AbortSignal
): Promise<void> {
	const socketManager = BrowserSocketManager.getInstance()

	try {
		if (abortSignal.aborted) return

		const hintNumber = await getNextHintNumber(chatData.careerQuestChatId)
		const messages = buildHintLLMContext(chatData, hintNumber)
		const modelId = selectModel("hint")

		socketManager.emitCqChatbotStart(userId, {
			careerId: chatData.careerId,
			challengeId: chatData.challengeId,
			interactionType: "hint"
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
			temperature: 0.4,
			max_completion_tokens: 1000,
			presence_penalty: 0.3,
			frequency_penalty: 0.2,
		}, {
			signal: abortSignal
		})

		let hintContent = ""

		// Stream chunks back via WebSocket
		for await (const chunk of stream) {
			if (abortSignal.aborted) break

			const content = chunk.choices[0]?.delta?.content

			if (content) {
				hintContent += content
				socketManager.emitCqChatbotChunk(userId, {
					careerId: chatData.careerId,
					challengeId: chatData.challengeId,
					content
				})
			}
		}

		// Only save if not aborted and we have content
		if (!abortSignal.aborted && hintContent.trim()) {
			await addCareerQuestHint({
				careerQuestChatId: chatData.careerQuestChatId,
				hintText: hintContent,
				modelUsed: modelId,
				hintNumber
			})

			socketManager.emitCqChatbotComplete(userId, {
				careerId: chatData.careerId,
				challengeId: chatData.challengeId
			})
		}
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			// Handle abort gracefully
		} else {
			console.error("Hint processing error:", error)
			if (!abortSignal.aborted) {
				// Could emit error via WebSocket here if needed
			}
		}
	} finally {
		// Clean up the stream
		StreamManager.getInstance().stopStream(streamId)
	}
}
