import PrismaClientClass from "../../../classes/prisma-client"
import { QuestionUUID } from "@actamayev/lever-labs-common-ts/types/utils"

export default async function addFillInTheBlankUserAnswer(
	userId: number,
	questionId: QuestionUUID,
	userCppAnswer: string,
	isCorrect: boolean
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.fill_in_the_blank_user_answer.create({
			data: {
				user_id: userId,
				fill_in_the_blank_id: questionId,
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
