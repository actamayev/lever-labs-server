import PrismaClientClass from "../../../classes/prisma-client"

interface FillInTheBlankQuestion {
	question_text: string
	reference_solution_cpp: string
}

export default async function retrieveFillInTheBlankQuestion(fillInTheBlankId: string): Promise<FillInTheBlankQuestion | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()
		const fitb = await prismaClient.fill_in_the_blank.findUnique({
			where: { question_id: fillInTheBlankId },
			select: { question_text: true, reference_solution_cpp: true }
		})
		return fitb
	} catch (error) {
		console.error(error)
		throw error
	}
}
