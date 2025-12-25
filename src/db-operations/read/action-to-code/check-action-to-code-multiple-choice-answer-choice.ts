import { isNull } from "lodash"
import PrismaClientClass from "../../../classes/prisma-client"
import { QuestionUUID } from "@actamayev/lever-labs-common-ts/types/utils"

export default async function getCorrectActionToCodeMultipleChoiceAnswerChoiceId(questionId: QuestionUUID): Promise<number | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()
		const correctAnswerChoice = await prismaClient.action_to_code_multiple_choice_answer_choice.findFirst({
			where: {
				action_to_code_multiple_choice_id: questionId,
				is_correct: true
			},
			select: {
				action_to_code_multiple_choice_answer_choice_id: true
			}
		})
		if (isNull(correctAnswerChoice)) return null
		return correctAnswerChoice.action_to_code_multiple_choice_answer_choice_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
