import { Prisma } from "@prisma/client"
import { ProcessedCareerQuestCheckCodeMessage } from "@bluedotrobots/common-ts"
import selectModel from "../../../utils/llm/model-selector"
import PrismaClientClass from "../../../classes/prisma-client"
import findChallengeDataFromId from "../../../utils/llm/find-challenge-data-from-id"

export default async function addCareerQuestCodeSubmission(
	chatData: ProcessedCareerQuestCheckCodeMessage,
	evaluationResult: BinaryEvaluationResult
): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const submission = await prismaClient.career_quest_code_submission.create({
			data: {
				career_quest_chat_id: chatData.careerQuestChatId,
				user_code: chatData.userCode,
				challenge_snapshot: findChallengeDataFromId(chatData.careerQuestChallengeId) as unknown as Prisma.InputJsonObject,
				evaluation_result: evaluationResult as unknown as Prisma.InputJsonObject,
				is_correct: evaluationResult.isCorrect,
				model_used: selectModel("checkCode")
			}
		})

		return submission.submission_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
