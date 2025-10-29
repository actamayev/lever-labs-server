import { isNull } from "lodash"
import PrismaClientClass from "../../../classes/prisma-client"
import { QuestionUUID } from "@lever-labs/common-ts/types/utils"

export default async function getCorrectFunctionToBlockAnswerChoiceId(questionId: QuestionUUID): Promise<number | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()
		const correctAnswerChoice = await prismaClient.function_to_block_answer_choice.findFirst({
			where: {
				function_to_block_flashcard_id: questionId,
				is_correct: true
			},
			select: {
				function_to_block_answer_choice_id: true
			}
		})
		if (isNull(correctAnswerChoice)) return null
		return correctAnswerChoice.function_to_block_answer_choice_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
