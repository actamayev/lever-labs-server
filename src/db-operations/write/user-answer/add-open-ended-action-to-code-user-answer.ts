import PrismaClientClass from "../../../classes/prisma-client"

export default async function addOpenEndedActionToCodeUserAnswer(
	userId: number,
	openEndedActionToCodeQuestionId: string,
	userCppAnswer: string,
	isCorrect: boolean
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.action_to_code_open_ended_question_user_answer.create({
			data: {
				user_id: userId,
				action_to_code_open_ended_question_id: openEndedActionToCodeQuestionId,
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
