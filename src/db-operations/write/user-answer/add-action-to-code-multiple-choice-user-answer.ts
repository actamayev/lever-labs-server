import PrismaClientClass from "../../../classes/prisma-client"

export default async function addActionToCodeMultipleChoiceUserAnswer(userId: number, answerChoiceId: number): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.action_to_code_multiple_choice_user_answer.create({
			data: {
				user_id: userId,
				action_to_code_multiple_choice_answer_choice_id: answerChoiceId
			}
		})
		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
