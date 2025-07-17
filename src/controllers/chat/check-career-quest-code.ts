
import { Response, Request } from "express"
import { CheckCodeResponse, ErrorResponse } from "@bluedotrobots/common-ts"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import findChallengeDataFromId from "../../utils/llm/find-challenge-data-from-id"
import addCareerQuestCodeSubmission from "../../db-operations/write/career-quest-code-submission/add-career-quest-code-submission"
import { getRandomCorrectResponse, getRandomIncorrectResponse } from "../../utils/career-quest-responses"

export default async function checkCareerQuestCode(req: Request, res: Response): Promise<void> {
	try {
		const chatData = req.body as ProcessedCareerQuestCheckCodeMessage

		// Get evaluation with score
		const evaluation = await evaluateCodeWithScore(chatData)

		// Get feedback message based on score
		const feedback = evaluation.isCorrect
			? getRandomCorrectResponse()
			: getRandomIncorrectResponse(evaluation.score)

		// Save the code submission to DB
		await addCareerQuestCodeSubmission(chatData, evaluation.isCorrect, evaluation.score, feedback)

		// Return simple response immediately
		res.status(200).json({ isCorrect: evaluation.isCorrect, feedback } satisfies CheckCodeResponse)
	} catch (error) {
		console.error("Code checking endpoint error:", error)
		res.status(500).json({
			error: "Internal Server Error: Unable to process code checking request"
		} satisfies ErrorResponse)
	}
}

// eslint-disable-next-line max-lines-per-function
async function evaluateCodeWithScore(chatData: ProcessedCareerQuestCheckCodeMessage): Promise<{ isCorrect: boolean; score: number }> {
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

Evaluate if the user's code correctly solves this challenge. ` +
					"Also provide a score (0.0-1.0) indicating how close they are to the correct solution, " +
					"where 1.0 means completely correct."
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
						score: {
							type: "number",
							description: "How close to correct (0.0 - 1.0, where 1.0 is correct)"
						}
					},
					required: ["isCorrect", "score"],
					additionalProperties: false
				}
			}
		},
		stream: false
	})

	const fallbackResult = "{\"isCorrect\": false, \"score\": 0.0}"
	const result = JSON.parse(response.choices[0].message.content || fallbackResult)
	return { isCorrect: result.isCorrect, score: result.score }
}
