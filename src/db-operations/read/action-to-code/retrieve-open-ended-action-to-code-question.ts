import { isNull } from "lodash"
import PrismaClientClass from "../../../classes/prisma-client"
import { QuestionUUID } from "@lever-labs/common-ts/types/utils"

interface ActionToCodeOpenEndedQuestion {
	questionText: string
	referenceSolutionCpp: string
}

export default async function retrieveOpenEndedActionToCodeQuestion(
	questionId: QuestionUUID
): Promise<ActionToCodeOpenEndedQuestion | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()
		const openEndedActionToCodeQuestion = await prismaClient.action_to_code_open_ended_question.findUnique({
			where: {
				question_id: questionId
			},
			select: {
				question_text: true,
				reference_solution_cpp: true
			}
		})
		if (isNull(openEndedActionToCodeQuestion)) return null
		return {
			questionText: openEndedActionToCodeQuestion.question_text,
			referenceSolutionCpp: openEndedActionToCodeQuestion.reference_solution_cpp
		} satisfies ActionToCodeOpenEndedQuestion
	} catch (error) {
		console.error(error)
		throw error
	}
}
