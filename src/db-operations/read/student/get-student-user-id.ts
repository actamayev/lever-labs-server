import PrismaClientClass from "../../../classes/prisma-client"

export default async function getStudentUserId(studentId: number): Promise<number | null> {
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

		return student?.user_id || null
	} catch (error) {
		console.error(error)
		throw error
	}
}
