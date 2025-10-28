import { isNull } from "lodash"
import PrismaClientClass from "../../../classes/prisma-client"

interface OpenEndedActionToCodeQuestion {
	questionText: string
	referenceSolutionCpp: string
}

export default async function retrieveOpenEndedActionToCodeQuestion(
	openEndedActionToCodeQuestionId: string
): Promise<OpenEndedActionToCodeQuestion | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()
		const openEndedActionToCodeQuestion = await prismaClient.action_to_code_open_ended_question.findUnique({
			where: { question_id: openEndedActionToCodeQuestionId },
			select: { question_text: true, reference_solution_cpp: true }
		})
		if (isNull(openEndedActionToCodeQuestion)) return null
		return {
			questionText: openEndedActionToCodeQuestion.question_text,
			referenceSolutionCpp: openEndedActionToCodeQuestion.reference_solution_cpp
		} satisfies OpenEndedActionToCodeQuestion
	} catch (error) {
		console.error(error)
		throw error
	}
}
