
import { Response, Request } from "express"
import { ErrorResponse } from "@bluedotrobots/common-ts"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import findChallengeDataFromId from "../../utils/llm/find-challenge-data-from-id"
import addCareerQuestCodeSubmission from "../../db-operations/write/career-quest-code-submission/add-career-quest-code-submission"
import { getRandomCorrectResponse, getRandomIncorrectResponse } from "../../utils/career-quest-responses"

export default async function checkCareerQuestCode(req: Request, res: Response): Promise<void> {
	try {
		const chatData = req.body as ProcessedCareerQuestCheckCodeMessage

		// Get binary evaluation
		const isCorrect = await evaluateCodeBinary(chatData)

		// Get random feedback message
		const feedback = isCorrect ? getRandomCorrectResponse() : getRandomIncorrectResponse()

		// Save the code submission to DB
		await addCareerQuestCodeSubmission(chatData, isCorrect)

		// Return simple response immediately
		res.status(200).json({
			isCorrect,
			feedback
		})

	} catch (error) {
		console.error("Code checking endpoint error:", error)
		res.status(500).json({
			error: "Internal Server Error: Unable to process code checking request"
		} satisfies ErrorResponse)
	}
}

// eslint-disable-next-line max-lines-per-function
async function evaluateCodeBinary(chatData: ProcessedCareerQuestCheckCodeMessage): Promise<boolean> {
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

Evaluate if the user's code correctly solves this challenge. Return only "true" or "false".`
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
	})

	const fallbackResult = "{\"isCorrect\": false}"
	const result = JSON.parse(response.choices[0].message.content || fallbackResult)
	return result.isCorrect
}
