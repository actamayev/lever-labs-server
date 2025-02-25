import PrismaClientClass from "../../../classes/prisma-client"

export default async function submitQuestionAnswerDb(userId: number, readingQuestionAnswerChoiceId: number): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.user_answer.create({
			data: {
				reading_question_answer_choice_id: readingQuestionAnswerChoiceId,
				user_id: userId
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
