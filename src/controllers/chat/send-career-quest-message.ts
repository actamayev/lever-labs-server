import { Response, Request } from "express"
import { MessageSender } from "@prisma/client"
import { ErrorResponse, ProcessedCareerQuestChatData, StartChatSuccess } from "@bluedotrobots/common-ts"
import StreamManager from "../../classes/stream-manager"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import buildCqLLMContext from "../../utils/llm/build-cq-llm-context"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import findChallengeDataFromId from "../../utils/llm/find-challenge-data-from-id"
import addCareerQuestMessage from "../../db-operations/write/career-quest-message/add-career-quest-message"
import addCareerQuestCodeSubmission from "../../db-operations/write/career-quest-code-submission/add-career-quest-code-submission"

export default function sendCareerQuestMessage(req: Request, res: Response): void {
	try {
		const { userId } = req
		const chatData = req.body as ProcessedCareerQuestChatData

		// Create a new stream and get streamId
		const { streamId, abortController } = StreamManager.getInstance().createStream()

		// Immediately respond with streamId so client can use it to stop if needed
		res.status(200).json({ streamId } satisfies StartChatSuccess)

		// Process LLM request with streaming via WebSocket (async)
		processLLMRequest(chatData, userId, streamId, abortController.signal)
			.catch(error => {
				console.error("Background LLM processing error:", error)
			})

	} catch (error) {
		console.error("Chatbot endpoint error:", error)
		res.status(500).json({
			error: "Internal Server Error: Unable to process chatbot request"
		} satisfies ErrorResponse)
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
		const isCodeSubmission = chatData.interactionType === "checkCode"

		if (isCodeSubmission) {
			// 1. Do the binary evaluation first
			const binaryResult = await evaluateCodeBinary(chatData, abortSignal)

			// 2. Save the code submission to DB
			await addCareerQuestCodeSubmission({
				careerQuestChatId: chatData.careerQuestChatId,
				userCode: chatData.userCode,
				challengeData: findChallengeDataFromId(chatData.careerQuestChallengeId),
				evaluationResult: binaryResult,
				isCorrect: binaryResult.isCorrect,
				modelUsed: selectModel("checkCode")
			})

			// 3. Save user message (as you currently do)
			await addCareerQuestMessage(
				chatData.careerQuestChatId,
				chatData.message,
				MessageSender.USER
			)

			// 4. Send instant feedback via WebSocket
			socketManager.emitCqCodeEvaluationResult(userId, {
				challengeId: chatData.careerQuestChallengeId,
				isCorrect: binaryResult.isCorrect,
				hasSubmission: true
			})
		}
		// Check if already aborted
		if (abortSignal.aborted) return

		// Save user message to database first
		const userMessage = chatData.message

		await addCareerQuestMessage(
			chatData.careerQuestChatId,
			userMessage,
			MessageSender.USER
		)

		// Build LLM context
		const messages = buildCqLLMContext(
			findChallengeDataFromId(chatData.careerQuestChallengeId),
			chatData.userCode,
			chatData.interactionType,
			chatData.conversationHistory,
			chatData.message,
		)

		// Select model based on interaction type
		const modelId = selectModel(chatData.interactionType)

		// Send start event with challengeId
		socketManager.emitCqChatbotStart(userId, chatData)

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
				// Check if aborted during streaming
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, max-depth
				if (abortSignal.aborted) break

				const content = chunk.choices[0]?.delta?.content
				// eslint-disable-next-line max-depth
				if (content) {
					aiResponseContent += content // Collect the content
					socketManager.emitCqChatbotChunk(userId, content, chatData.careerQuestChallengeId)
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

// eslint-disable-next-line max-lines-per-function
async function evaluateCodeBinary(
	chatData: ProcessedCareerQuestChatData,
	abortSignal: AbortSignal
): Promise<{ isCorrect: boolean }> {
	const challengeData = findChallengeDataFromId(chatData.careerQuestChallengeId)

	const openAiClient = await OpenAiClientClass.getOpenAiClient()

	const response = await openAiClient.chat.completions.create({
		model: selectModel("checkCode"),
		messages: [
			{
				role: "system",
				content: "You are a robotics code evaluator. Analyze if the user's code correctly solves the challenge."
			},
			{
				role: "user",
				content: `Challenge: ${challengeData.title}
Description: ${challengeData.description}
Expected Behavior: ${challengeData.expectedBehavior}
Solution: ${challengeData.solutionCode}
User Code: ${chatData.userCode}

Evaluate if the user code correctly implements the challenge requirements.`
			}
		],
		response_format: {
			type: "json_schema",
			json_schema: {
				name: "code_evaluation",
				strict: true,
				schema: {
					type: "object",
					properties: {
						isCorrect: {
							type: "boolean",
							description: "Whether the user's code correctly solves the challenge"
						}
					},
					required: ["isCorrect"],
					additionalProperties: false
				}
			}
		},
		stream: false
	}, {
		signal: abortSignal
	})

	return JSON.parse(response.choices[0].message.content || "{}")
}
