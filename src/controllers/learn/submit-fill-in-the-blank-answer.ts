import { Response, Request } from "express"
import { CheckCodeResponse, ErrorResponse } from "@lever-labs/common-ts/types/api"
import addFillInTheBlankUserAnswer from "../../db-operations/write/user-answer/add-fill-in-the-blank-user-answer"
import selectModel from "../../utils/llm/model-selector"
import OpenAiClientClass from "../../classes/openai-client"
import buildCheckFITBLLMContext, { fitbCheckResponseFormat } from "../../utils/llm/learn/build-check-fitb-llm-context"
import { getRandomCorrectResponse, getRandomIncorrectResponse } from "../../utils/career-quest-responses"
import retrieveFillInTheBlankQuestion from "../../db-operations/read/fill-in-the-blank/retrieve-fill-in-the-blank-question"

// eslint-disable-next-line max-lines-per-function
export default async function submitFillInTheBlankAnswer(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { fillInTheBlankId, userCode } = req.body as {
			fillInTheBlankId: string; userCode: string
		}

		// Fetch reference solution and question text
		const fitb = await retrieveFillInTheBlankQuestion(fillInTheBlankId)
		if (!fitb) {
			res.status(400).json({ error: "Invalid fill in the blank id" } satisfies ErrorResponse)
			return
		}

		// Evaluate with LLM (assume not a definite solution)
		const openAiClient = await OpenAiClientClass.getOpenAiClient()
		const messages = buildCheckFITBLLMContext(
			fitb.question_text,
			fitb.reference_solution_cpp,
			userCode
		)
		const response = await openAiClient.chat.completions.create({
			model: selectModel("checkCode"),
			messages: messages.map(m => ({ role: m.role, content: m.content })),
			response_format: fitbCheckResponseFormat,
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
		await addFillInTheBlankUserAnswer(userId, fillInTheBlankId, userCode, result.isCorrect)

		// Return response
		res.status(200).json({ isCorrect: result.isCorrect, feedback } satisfies CheckCodeResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to submit fill in the blank answer" } satisfies ErrorResponse)
		return
	}
}
