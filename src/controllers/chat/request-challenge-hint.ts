/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Response, Request } from "express"
import { ChallengeUUID, ErrorResponse, StartChatSuccess, CheckCodeResponse } from "@bluedotrobots/common-ts"
import StreamManager from "../../classes/stream-manager"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import buildHintLLMContext from "../../utils/llm/career-quest/build-hint-request-llm-context"
import getNextHintNumber from "../../db-operations/read/challenge-hint/get-next-hint-number"
import addChallengeHint from "../../db-operations/write/challenge-hint/add-challenge-hint"
import { getRandomCorrectResponse } from "../../utils/career-quest-responses"
import addChallengeCodeSubmission from "../../db-operations/write/challenge-code-submission/add-challenge-code-submission"
import { evaluateCodeWithScore } from "./check-challenge-code"

export default async function requestChallengeHint(req: Request, res: Response): Promise<void> {
	try {
		const { userId, challengeId } = req
		const { challengeUUID } = req.params as { challengeUUID: ChallengeUUID }
		const chatData = req.body as ProcessedChallengeHintMessage

		// First, check if the user's code is already correct
		const evaluation = await evaluateCodeWithScore(challengeUUID, chatData)

		if (evaluation.isCorrect) {
			// Code is correct - return check code response instead of hint
			const feedback = getRandomCorrectResponse()
			// Save the code submission to DB
			await addChallengeCodeSubmission(challengeId, userId, chatData, evaluation, feedback)

			// Return check code response
			res.status(200).json({ isCorrect: true, feedback } satisfies CheckCodeResponse)
			return
		}

		// Code is incorrect - proceed with hint request
		// Create a new stream and get streamId
		const { streamId, abortController } = StreamManager.getInstance().createStream()

		// Immediately respond with streamId so client can use it to stop if needed
		res.status(200).json({ streamId } satisfies StartChatSuccess)

		// Process hint request with streaming via WebSocket (async)
		void processHintRequest(challengeId, challengeUUID, chatData, userId, streamId, abortController.signal)
	} catch (error) {
		console.error("Hint request endpoint error:", error)
		res.status(500).json({
			error: "Internal Server Error: Unable to process hint request"
		} satisfies ErrorResponse)
	}
}

// eslint-disable-next-line max-lines-per-function, complexity
async function processHintRequest(
	challengeId: number,
	challengeUUID: ChallengeUUID,
	chatData: ProcessedChallengeHintMessage,
	userId: number,
	streamId: string,
	abortSignal: AbortSignal
): Promise<void> {
	const socketManager = BrowserSocketManager.getInstance()

	try {
		if (abortSignal.aborted) return

		const hintNumber = await getNextHintNumber(challengeId, userId)
		const messages = buildHintLLMContext(challengeUUID, chatData, hintNumber)
		const modelId = selectModel("hint")

		socketManager.emitToUser(userId, "challenge-chatbot-stream-start", {
			careerUUID: chatData.careerUUID,
			challengeUUID,
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
				socketManager.emitToUser(userId, "challenge-chatbot-stream-chunk", {
					careerUUID: chatData.careerUUID,
					challengeUUID,
					content
				})
			}
		}

		// Only save if not aborted and we have content
		if (!abortSignal.aborted && hintContent.trim()) {
			await addChallengeHint({
				challengeId,
				userId,
				hintText: hintContent,
				modelUsed: modelId,
				hintNumber
			})

			socketManager.emitToUser(userId, "challenge-chatbot-stream-complete", {
				careerUUID: chatData.careerUUID,
				challengeUUID
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
