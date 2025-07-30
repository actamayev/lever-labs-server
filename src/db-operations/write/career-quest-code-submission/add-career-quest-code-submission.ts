import PrismaClientClass from "../../../classes/prisma-client"

export default async function addCareerQuestCodeSubmission(
	challengeId: number,
	userId: number,
	chatData: ProcessedCareerQuestCheckCodeMessage,
	codeWithScore: CodeWithScore,
	feedback: string
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.career_quest_code_submission.create({
			data: {
				challenge_id: challengeId,
				user_id: userId,
				user_code: chatData.userCode,
				is_correct: codeWithScore.isCorrect,
				score: codeWithScore.score,
				feedback
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
