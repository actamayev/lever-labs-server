import { isNull } from "lodash"
import PrismaClientClass from "../../../classes/prisma-client"
import { QuestionUUID } from "@lever-labs/common-ts/types/utils"

export default async function getCorrectBlockToFunctionAnswerChoiceId(questionId: QuestionUUID): Promise<number | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()
		const correctAnswerChoice = await prismaClient.block_to_function_answer_choice.findFirst({
			where: {
				block_to_function_flashcard_id: questionId,
				is_correct: true
			},
			select: {
				block_to_function_answer_choice_id: true
			}
		})
		if (isNull(correctAnswerChoice)) return null
		return correctAnswerChoice.block_to_function_answer_choice_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
