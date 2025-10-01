import PrismaClientClass from "../../../classes/prisma-client"

export default async function addFillInTheBlankUserAnswer(
	userId: number,
	fillInTheBlankId: string,
	userCppAnswer: string,
	isCorrect: boolean
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.fill_in_the_blank_user_answer.create({
			data: {
				user_id: userId,
				fill_in_the_blank_id: fillInTheBlankId,
				user_cpp_answer: userCppAnswer,
				is_correct: isCorrect
			}
		})
		return
	} catch (error) {
		console.error(error)
		throw error
	}
}


