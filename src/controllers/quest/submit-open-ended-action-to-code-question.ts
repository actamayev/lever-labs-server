import { Response, Request } from "express"
import { CheckCodeResponse, ErrorResponse } from "@lever-labs/common-ts/types/api"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import buildCheckOpenEndedActionToCodeQuestionLLMContext,
{ openEndedActionToCodeCheckResponseFormat } from "../../utils/llm/quest/build-check-open-ended-action-to-code-question-llm-context"
import { getRandomCorrectResponse, getRandomIncorrectResponse } from "../../utils/career-quest-responses"
import addOpenEndedActionToCodeUserAnswer from "../../db-operations/write/user-answer/add-open-ended-action-to-code-user-answer"
import retrieveOpenEndedActionToCodeQuestion from "../../db-operations/read/action-to-code/retrieve-open-ended-action-to-code-question"
import { QuestionUUID } from "@lever-labs/common-ts/types/utils"

export default async function submitOpenEndedActionToCodeAnswer(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { questionId } = req.params as { questionId: QuestionUUID }
		const { userCode } = req.body as { userCode: string }

		// Fetch reference solution and question text
		const openEndedActionToCodeQuestion = await retrieveOpenEndedActionToCodeQuestion(questionId)
		if (!openEndedActionToCodeQuestion) {
			res.status(400).json({ error: "Invalid open ended action to code id" } satisfies ErrorResponse)
			return
		}

		// Evaluate with LLM (assume not a definite solution)
		const openAiClient = await OpenAiClientClass.getOpenAiClient()
		const messages = buildCheckOpenEndedActionToCodeQuestionLLMContext(
			openEndedActionToCodeQuestion.questionText,
			openEndedActionToCodeQuestion.referenceSolutionCpp,
			userCode
		)
		const response = await openAiClient.chat.completions.create({
			model: selectModel("checkCode"),
			messages: messages.map(m => ({ role: m.role, content: m.content })),
			response_format: openEndedActionToCodeCheckResponseFormat,
			stream: false
		})

		const fallbackResult = { isCorrect: false, score: 0.0 }
		const rawContent = response.choices[0].message.content || JSON.stringify(fallbackResult)
		const result = JSON.parse(rawContent) as { isCorrect: boolean; score: number }

		// Minimal feedback alongside correctness
		let feedback: string
		if (result.isCorrect) {
			feedback = getRandomCorrectResponse()
		} else {
			feedback = getRandomIncorrectResponse(result.score)
		}

		// Save to DB
		await addOpenEndedActionToCodeUserAnswer(userId, questionId, userCode, result.isCorrect)

		// Return response
		res.status(200).json({ isCorrect: result.isCorrect, feedback } satisfies CheckCodeResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to submit fill in the blank answer" } satisfies ErrorResponse)
		return
	}
}
