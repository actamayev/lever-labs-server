import { Prisma } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"
import { findChallengeSnapshotFromId } from "../../../utils/llm/find-challenge-data-from-id"

export default async function addCareerQuestCodeSubmission(
	chatData: ProcessedCareerQuestCheckCodeMessage,
	codeWithScore: CodeWithScore,
	feedback: string
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.career_quest_code_submission.create({
			data: {
				career_quest_chat_id: chatData.careerQuestChatId,
				user_code: chatData.userCode,
				challenge_snapshot: findChallengeSnapshotFromId(chatData.challengeId) as unknown as Prisma.InputJsonObject,
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
