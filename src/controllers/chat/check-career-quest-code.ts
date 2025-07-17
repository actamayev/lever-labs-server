/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Response, Request } from "express"
import { MessageSender } from "@prisma/client"
import { BinaryEvaluationResult, CheckCodeResponse, ErrorResponse } from "@bluedotrobots/common-ts"
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
			feedback: binaryResult.feedback,
			streamId
		} satisfies CheckCodeResponse)

		// 5. Process explanation streaming in background
		processExplanationStreaming(chatData, binaryResult, userId, streamId, abortController.signal)
			.catch(error => {
				console.error("Background explanation streaming error:", error)
			})
	} catch (error) {
		console.error("Code checking endpoint error:", error)
		res.status(500).json({ error: "Internal Server Error: Unable to process code checking request" } satisfies ErrorResponse)
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
				content: "You are a precise robotics code evaluator. " +
					`Analyze if the user's code correctly implements the challenge requirements.

EVALUATION CRITERIA:
✅ Does it achieve the expected behavior?
✅ Are the core logic and structure correct?
✅ Does it follow safe robotics practices?

❌ Identify logical errors or missing functionality
❌ Note if it doesn't match the solution approach

Be thorough but fair - focus on functional correctness for this challenge.`
			},
			{
				role: "user",
				content: `CHALLENGE: ${challengeData.title}
DESCRIPTION: ${challengeData.description}
EXPECTED BEHAVIOR: ${challengeData.expectedBehavior}

REFERENCE SOLUTION:
\`\`\`cpp
${challengeData.solutionCode}
\`\`\`

USER'S CODE:
\`\`\`cpp
${chatData.userCode}
\`\`\`

Evaluate if the user's code correctly solves this challenge. Provide brief, specific feedback.`
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
		? `You are an encouraging robotics mentor. The student's code is CORRECT! 

Provide positive, educational feedback that:
✅ Celebrates their success
✅ Explains why their solution works well
✅ Highlights good robotics practices they used
✅ Connects to broader learning concepts

Keep it concise, encouraging, and educational.`
		: `You are a supportive robotics mentor. The student's code needs improvement.

Provide constructive feedback that:
✅ Stays encouraging and positive
✅ Explains what needs to be fixed and why
✅ Suggests next steps to improve
✅ Connects to robotics learning concepts

Keep it concise, helpful, and motivating.`

	const userPrompt = binaryResult.isCorrect
		? `EXCELLENT WORK! The student correctly solved the challenge:

CHALLENGE: ${challengeData.title}
EXPECTED BEHAVIOR: ${challengeData.expectedBehavior}

STUDENT'S CODE:
\`\`\`cpp
${chatData.userCode}
\`\`\`

EVALUATION: ${binaryResult.feedback}

Explain why their solution works and what they did well. Be encouraging and educational.`
		: `The student's code needs improvement:

CHALLENGE: ${challengeData.title}
EXPECTED BEHAVIOR: ${challengeData.expectedBehavior}

STUDENT'S CODE:
\`\`\`cpp
${chatData.userCode}
\`\`\`

COMMON MISTAKES: ${challengeData.commonMistakes.join(", ")}
EVALUATION: ${binaryResult.feedback}

Explain what needs fixing and guide them toward the solution. Be supportive and constructive.`

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
