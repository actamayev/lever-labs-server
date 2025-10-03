import PrismaClientClass from "../../../classes/prisma-client"

export default async function addFunctionToBlockUserAnswer(userId: number, answerChoiceId: number): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.function_to_block_user_answer.create({
			data: {
				user_id: userId,
				function_to_block_answer_choice_id: answerChoiceId
			}
		})
		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
