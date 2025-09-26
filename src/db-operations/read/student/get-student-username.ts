import PrismaClientClass from "../../../classes/prisma-client"
import retrieveUsername from "../credentials/retrieve-username"

export default async function getStudentUsername(studentId: number): Promise<string | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const student = await prismaClient.student.findUnique({
			where: {
				student_id: studentId
			},
			select: {
				user_id: true
			}
		})

		if (!student?.user_id) {
			return null
		}

		const username = await retrieveUsername(student.user_id)
		return username || null
	} catch (error) {
		console.error(error)
		throw error
	}
}
