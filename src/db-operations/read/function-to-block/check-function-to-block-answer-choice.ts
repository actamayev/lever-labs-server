import { isNull } from "lodash"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function checkFunctionToBlockAnswerChoice(answerChoiceId: number): Promise<boolean> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()
		const answerChoice = await prismaClient.function_to_block_answer_choice.findUnique({
			where: {
				function_to_block_answer_choice_id: answerChoiceId,
			},
			select: {
				is_correct: true
			}
		})
		if (isNull(answerChoice)) return false
		return answerChoice.is_correct
	} catch (error) {
		console.error(error)
		throw error
	}
}
