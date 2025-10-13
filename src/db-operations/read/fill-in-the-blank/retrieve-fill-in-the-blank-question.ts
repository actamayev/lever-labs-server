import PrismaClientClass from "../../../classes/prisma-client"
import { isNull } from "lodash"

interface FillInTheBlankQuestion {
	questionText: string
	referenceSolutionCpp: string
}

export default async function retrieveFillInTheBlankQuestion(fillInTheBlankId: string): Promise<FillInTheBlankQuestion | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()
		const fitb = await prismaClient.fill_in_the_blank.findUnique({
			where: { question_id: fillInTheBlankId },
			select: { question_text: true, reference_solution_cpp: true }
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
