import { Prisma } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"

interface ChallengeData {
	title: string
	description: string
	expectedBehavior: string
	solutionCode: string
}

interface EvaluationResult {
	isCorrect: boolean
}

interface CodeSubmissionData {
	careerQuestChatId: number
	userCode: string
	challengeData: ChallengeData
	evaluationResult: EvaluationResult
	isCorrect: boolean
	modelUsed?: string
}

export default async function addCareerQuestCodeSubmission(
	data: CodeSubmissionData
): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const submission = await prismaClient.career_quest_code_submission.create({
			data: {
				career_quest_chat_id: data.careerQuestChatId,
				user_code: data.userCode,
				challenge_snapshot: data.challengeData as unknown as Prisma.InputJsonObject,
				evaluation_result: data.evaluationResult as unknown as Prisma.InputJsonObject,
				is_correct: data.isCorrect,
				model_used: data.modelUsed
			}
		})

		return submission.submission_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
