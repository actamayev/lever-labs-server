import { Prisma } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"
import findChallengeDataFromId from "../../../utils/llm/find-challenge-data-from-id"
import { getRandomCorrectResponse, getRandomIncorrectResponse } from "../../../utils/career-quest-responses"

export default async function addCareerQuestCodeSubmission(
	chatData: ProcessedCareerQuestCheckCodeMessage,
	isCorrect: boolean
): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const feedback = isCorrect ? getRandomCorrectResponse() : getRandomIncorrectResponse()

		const submission = await prismaClient.career_quest_code_submission.create({
			data: {
				career_quest_chat_id: chatData.careerQuestChatId,
				user_code: chatData.userCode,
				challenge_snapshot: findChallengeDataFromId(chatData.careerQuestChallengeId) as unknown as Prisma.InputJsonObject,
				is_correct: isCorrect,
				feedback
			}
		})

		return submission.submission_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
