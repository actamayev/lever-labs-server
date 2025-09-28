/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Response, Request } from "express"
import { MessageSender } from "@prisma/client"
import { ErrorResponse, StartChatSuccess } from "@lever-labs/common-ts/types/api"
import { ChallengeUUID } from "@lever-labs/common-ts/types/utils"
import StreamManager from "../../classes/stream-manager"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import buildChallengeLLMContext from "../../utils/llm/career-quest/build-challenge-llm-context"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import addChallengeMessage from "../../db-operations/write/challenge-message/add-challenge-message"

export default function sendChallengeMessage(req: Request, res: Response): void {
	try {
		const { userId } = req
		const { challengeUUID } = req.params as { challengeUUID: ChallengeUUID }
		const chatData = req.body as ProcessedChallengeGeneralMessage

		// Create a new stream and get streamId
		const { streamId, abortController } = StreamManager.getInstance().createStream()

		// Immediately respond with streamId so client can use it to stop if needed
		res.status(200).json({ streamId } satisfies StartChatSuccess)

		// Process LLM request with streaming via WebSocket (async)
		void processLLMRequest(challengeUUID, chatData, userId, streamId, abortController.signal)
	} catch (error) {
		console.error("Chatbot endpoint error:", error)
		res.status(500).json({
			error: "Internal Server Error: Unable to process chatbot request"
		} satisfies ErrorResponse)
	}
}

// eslint-disable-next-line max-lines-per-function, complexity
async function processLLMRequest(
	challengeUUID: ChallengeUUID,
	chatData: ProcessedChallengeGeneralMessage,
	userId: number,
	streamId: string,
	abortSignal: AbortSignal
): Promise<void> {
	const socketManager = BrowserSocketManager.getInstance()

	try {
		if (abortSignal.aborted) return

		await addChallengeMessage(
			chatData.challengeChatId,
			chatData.message,
			MessageSender.USER
		)

		const messages = buildChallengeLLMContext(challengeUUID, chatData)
		const modelId = selectModel("generalQuestion")

		socketManager.emitToUser(userId, "challenge-chatbot-stream-start", {
			careerUUID: chatData.careerUUID,
			challengeUUID,
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
				socketManager.emitToUser(userId, "challenge-chatbot-stream-chunk", {
					careerUUID: chatData.careerUUID,
					challengeUUID,
					content
				})
			}
		}

		// Only save and send completion if not aborted
		if (!abortSignal.aborted && aiResponseContent.trim()) {
			await addChallengeMessage(
				chatData.challengeChatId,
				aiResponseContent,
				MessageSender.AI,
				modelId
			)

			socketManager.emitToUser(userId, "challenge-chatbot-stream-complete", {
				careerUUID: chatData.careerUUID,
				challengeUUID
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
