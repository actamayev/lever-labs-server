
import { Response, Request } from "express"
import { ChallengeUUID, CheckCodeResponse, ErrorResponse } from "@bluedotrobots/common-ts"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import addCareerQuestCodeSubmission from "../../db-operations/write/career-quest-code-submission/add-career-quest-code-submission"
import { getRandomCorrectResponse, getRandomIncorrectResponse } from "../../utils/career-quest-responses"
import buildCheckCodeLLMContext, { checkCodeResponseFormat } from "../../utils/llm/career-quest/build-check-code-llm-context"
import findChallengeDataFromUUID from "../../utils/llm/find-challenge-data-from-uuid"

export default async function checkCareerQuestCode(req: Request, res: Response): Promise<void> {
	try {
		const { userId, challengeId } = req
		const { challengeUUID } = req.params as { challengeUUID: ChallengeUUID }
		const chatData = req.body as ProcessedCareerQuestCheckCodeMessage

		// Get evaluation with score
		const evaluation = await evaluateCodeWithScore(challengeUUID, chatData)

		// Get feedback message based on score
		const feedback = evaluation.isCorrect
			? getRandomCorrectResponse()
			: getRandomIncorrectResponse(evaluation.score)

		// Save the code submission to DB
		await addCareerQuestCodeSubmission(challengeId, userId, chatData, evaluation, feedback)

		// Return simple response immediately
		res.status(200).json({ isCorrect: evaluation.isCorrect, feedback } satisfies CheckCodeResponse)
	} catch (error) {
		console.error("Code checking endpoint error:", error)
		res.status(500).json({
			error: "Internal Server Error: Unable to process code checking request"
		} satisfies ErrorResponse)
	}
}

async function evaluateCodeWithScore(
	challengeUUID: ChallengeUUID,
	chatData: ProcessedCareerQuestCheckCodeMessage
): Promise<CodeWithScore> {
	const challengeData = findChallengeDataFromUUID(challengeUUID)
	const openAiClient = await OpenAiClientClass.getOpenAiClient()

	// Build LLM context messages
	const messages = buildCheckCodeLLMContext(challengeData, chatData.userCode)

	const response = await openAiClient.chat.completions.create({
		model: selectModel("checkCode"),
		messages: messages.map(msg => ({
			role: msg.role,
			content: msg.content
		})),
		response_format: checkCodeResponseFormat,
		stream: false
	})

	const fallbackResult = "{\"isCorrect\": false, \"score\": 0.0}"
	const result = JSON.parse(response.choices[0].message.content || fallbackResult)
	return { isCorrect: result.isCorrect, score: result.score }
}
