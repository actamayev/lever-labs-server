import PrismaClientClass from "../../../classes/prisma-client"

export default async function addBlockToFunctionUserAnswer(userId: number, answerChoiceId: number): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.block_to_function_user_answer.create({
			data: {
				user_id: userId,
				block_to_function_answer_choice_id: answerChoiceId
			}
		})
		return
	} catch (error) {
		console.error(error)
		throw error
	}
}


