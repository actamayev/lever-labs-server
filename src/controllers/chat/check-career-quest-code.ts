/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Response, Request } from "express"
import { MessageSender } from "@prisma/client"
import { CheckCodeResponse, ErrorResponse, ProcessedCareerQuestCheckCodeMessage } from "@bluedotrobots/common-ts"
import StreamManager from "../../classes/stream-manager"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import findChallengeDataFromId from "../../utils/llm/find-challenge-data-from-id"
import addCareerQuestMessage from "../../db-operations/write/career-quest-message/add-career-quest-message"
import addCareerQuestCodeSubmission from "../../db-operations/write/career-quest-code-submission/add-career-quest-code-submission"

// Binary response returned immediately, then stream the explanation
export default async function checkCareerQuestCode(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const chatData = req.body as ProcessedCareerQuestCheckCodeMessage

		// 1. Get binary evaluation first (await it, don't chunk)
		const binaryResult = await evaluateCodeBinary(chatData)

		// 2. Save the code submission to DB
		await addCareerQuestCodeSubmission(chatData, binaryResult)

		// 3. Create stream for explanation
		const { streamId, abortController } = StreamManager.getInstance().createStream()

		// 4. Return binary response immediately with streamId
		res.status(200).json({
			isCorrect: binaryResult.isCorrect,
			feedback: binaryResult.feedback || "Code evaluation completed",
			streamId
		} satisfies CheckCodeResponse)

		// 5. Process explanation streaming in background
		processExplanationStreaming(chatData, binaryResult, userId, streamId, abortController.signal)
			.catch(error => {
				console.error("Background explanation streaming error:", error)
			})
	} catch (error) {
		console.error("Code checking endpoint error:", error)
		res.status(500).json({
			error: "Internal Server Error: Unable to process code checking request"
		} satisfies ErrorResponse)
	}
}

// eslint-disable-next-line max-lines-per-function, complexity
async function processExplanationStreaming(
	chatData: ProcessedCareerQuestCheckCodeMessage,
	binaryResult: BinaryEvaluationResult,
	userId: number,
	streamId: string,
	abortSignal: AbortSignal
): Promise<void> {
	const socketManager = BrowserSocketManager.getInstance()

	try {
		// Check if already aborted
		if (abortSignal.aborted) return

		// Generate targeted explanation based on binary result
		const explanation = await generateCodeExplanation(chatData, binaryResult, abortSignal)

		// Check if already aborted before saving explanation
		if (abortSignal.aborted) return

		// Save explanation to database
		await addCareerQuestMessage(
			chatData.careerQuestChatId,
			explanation,
			MessageSender.AI,
			selectModel("checkCode")
		)

		// Stream the explanation to the user
		socketManager.emitCqChatbotStart(userId, {
			challengeId: chatData.careerQuestChallengeId,
			interactionType: "checkCode"
		})

		// Stream the explanation in chunks
		const chunks = explanation.split(" ")
		for (let i = 0; i < chunks.length; i++) {
			if (abortSignal.aborted) break

			const chunk = i === 0 ? chunks[i] : " " + chunks[i]
			socketManager.emitCqChatbotChunk(userId, chunk, chatData.careerQuestChallengeId)

			// Small delay to make streaming visible
			await new Promise(resolve => setTimeout(resolve, 50))
		}

		// Send completion event if not aborted
		if (!abortSignal.aborted) {
			socketManager.emitCqChatbotComplete(userId, chatData.careerQuestChallengeId)
		}

	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			// Handle abort gracefully
		} else {
			console.error("Explanation streaming error:", error)
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
	chatData: ProcessedCareerQuestCheckCodeMessage
): Promise<BinaryEvaluationResult> {
	const challengeData = findChallengeDataFromId(chatData.careerQuestChallengeId)
	const openAiClient = await OpenAiClientClass.getOpenAiClient()

	const response = await openAiClient.chat.completions.create({
		model: selectModel("checkCode"),
		messages: [
			{
				role: "system",
				content: `You are a robotics code evaluator. Analyze if the user's code correctly solves the challenge requirements.

Focus on:
- Does the code implement the expected behavior?
- Are there any logical errors?
- Does it match the solution approach?

Be strict but fair in your evaluation.`
			},
			{
				role: "user",
				content: `Challenge: ${challengeData.title}
Description: ${challengeData.description}
Expected Behavior: ${challengeData.expectedBehavior}
Solution: ${challengeData.solutionCode}
User Code: ${chatData.userCode}

Evaluate if the user code correctly implements the challenge requirements. Provide brief feedback on what's correct or incorrect.`
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
						},
						feedback: {
							type: "string",
							description: "Brief feedback on the evaluation"
						}
					},
					required: ["isCorrect", "feedback"],
					additionalProperties: false
				}
			}
		},
		stream: false
	})

	const fallbackResult = "{\"isCorrect\": false, \"feedback\": \"Unable to evaluate code\"}"
	return JSON.parse(response.choices[0].message.content || fallbackResult)
}

// eslint-disable-next-line max-lines-per-function
async function generateCodeExplanation(
	chatData: ProcessedCareerQuestCheckCodeMessage,
	binaryResult: BinaryEvaluationResult,
	abortSignal: AbortSignal
): Promise<string> {
	const challengeData = findChallengeDataFromId(chatData.careerQuestChallengeId)
	const openAiClient = await OpenAiClientClass.getOpenAiClient()

	const systemPrompt = binaryResult.isCorrect
		? "You are a supportive robotics mentor. The user's code is CORRECT. " +
		  "Provide encouraging feedback and explain why their solution works well."
		: "You are a helpful robotics mentor. The user's code is INCORRECT. " +
		  "Provide constructive feedback to help them improve their solution."

	const userPrompt = binaryResult.isCorrect
		? `Great work! The user's code correctly solves the challenge. Here's what they submitted:

Challenge: ${challengeData.title}
Description: ${challengeData.description}
Expected Behavior: ${challengeData.expectedBehavior}
User Code: ${chatData.userCode}
Evaluation: ${binaryResult.feedback}

Explain why their solution works and what they did well. Keep it encouraging and educational.`
		: `The user's code needs improvement. Here's what they submitted:

Challenge: ${challengeData.title}
Description: ${challengeData.description}
Expected Behavior: ${challengeData.expectedBehavior}
User Code: ${chatData.userCode}
Common Mistakes: ${challengeData.commonMistakes.join(", ")}
Evaluation: ${binaryResult.feedback}

Explain what's wrong and provide guidance on how to fix it. Be helpful and encouraging.`

	const response = await openAiClient.chat.completions.create({
		model: selectModel("checkCode"),
		messages: [
			{
				role: "system",
				content: systemPrompt
			},
			{
				role: "user",
				content: userPrompt
			}
		],
		stream: false,
		temperature: 0.3, // Lower for more focused, consistent responses
		max_completion_tokens: 800,
		presence_penalty: 0.1,
		frequency_penalty: 0.2,
	}, {
		signal: abortSignal
	})

	return response.choices[0].message.content || "Unable to generate explanation."
}
