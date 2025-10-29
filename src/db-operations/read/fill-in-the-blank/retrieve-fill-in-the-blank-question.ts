import PrismaClientClass from "../../../classes/prisma-client"
import { isNull } from "lodash"
import { QuestionUUID } from "@lever-labs/common-ts/types/utils"

interface FillInTheBlankQuestion {
	questionText: string
	referenceSolutionCpp: string
}

export default async function retrieveFillInTheBlankQuestion(questionId: QuestionUUID): Promise<FillInTheBlankQuestion | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()
		const fitb = await prismaClient.fill_in_the_blank.findUnique({
			where: {
				question_id: questionId
			},
			select: {
				question_text: true,
				reference_solution_cpp: true
			}
		})
		if (isNull(fitb)) return null
		return {
			questionText: fitb.question_text,
			referenceSolutionCpp: fitb.reference_solution_cpp
		} satisfies FillInTheBlankQuestion
	} catch (error) {
		console.error(error)
		throw error
	}
}
