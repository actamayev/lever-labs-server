import PrismaClientClass from "../../../classes/prisma-client"

export default async function addMatchingUserAnswer(
	userId: number,
	matchingAnswerChoiceTextId: number,
	codingBlockId: number,
	isCorrect: boolean
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.matching_question_user_answer.create({
			data: {
				user_id: userId,
				matching_answer_choice_text_id: matchingAnswerChoiceTextId,
				coding_block_id: codingBlockId,
				is_correct: isCorrect
			}
		})
		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
