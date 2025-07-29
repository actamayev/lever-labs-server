import { Prisma } from "@prisma/client"
import { ChallengeUUID } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"
import { findChallengeSnapshotFromUUID } from "../../../utils/llm/find-challenge-data-from-uuid"

export default async function addCareerQuestCodeSubmission(
	challengeUUID: ChallengeUUID,
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
				challenge_snapshot: findChallengeSnapshotFromUUID(challengeUUID) as unknown as Prisma.InputJsonObject,
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
