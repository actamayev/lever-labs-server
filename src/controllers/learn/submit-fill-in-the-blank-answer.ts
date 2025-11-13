import { Response, Request } from "express"
import { CheckCodeResponse, ErrorResponse } from "@lever-labs/common-ts/types/api"
import addFillInTheBlankUserAnswer from "../../db-operations/write/user-answer/add-fill-in-the-blank-user-answer"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import buildCheckFITBLLMContext, { fitbCheckResponseFormat } from "../../utils/llm/learn/build-check-fitb-llm-context"
import { getRandomCorrectResponse, getRandomIncorrectResponse } from "../../utils/career-quest-responses"
import retrieveFillInTheBlankQuestion from "../../db-operations/read/fill-in-the-blank/retrieve-fill-in-the-blank-question"
import { QuestionUUID } from "@lever-labs/common-ts/types/utils"

export default async function submitFillInTheBlankAnswer(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { questionId } = req.params as { questionId: QuestionUUID }
		const { userCode } = req.body as { userCode: string }

		// Fetch reference solution and question text
		const fitb = await retrieveFillInTheBlankQuestion(questionId)
		if (!fitb) {
			res.status(400).json({ error: "Invalid fill in the blank id" } satisfies ErrorResponse)
			return
		}

		// Evaluate with LLM (assume not a definite solution)
		const openAiClient = await OpenAiClientClass.getOpenAiClient()
		const messages = buildCheckFITBLLMContext(
			fitb.questionText,
			fitb.referenceSolutionCpp,
			userCode
		)
		const response = await openAiClient.chat.completions.create({
			model: selectModel("checkCode"),
			messages: messages.map(m => ({ role: m.role, content: m.content })),
			response_format: fitbCheckResponseFormat,
			// TODO: test with lower temperature (also add to other check code endpoints)
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
		await addFillInTheBlankUserAnswer(userId, questionId, userCode, result.isCorrect)

		// Return response
		res.status(200).json({ isCorrect: result.isCorrect, feedback } satisfies CheckCodeResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to submit fill in the blank answer" } satisfies ErrorResponse)
		return
	}
}
