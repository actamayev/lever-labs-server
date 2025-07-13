import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveStudentId(userId: number, classroomId: number): Promise<number | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const student = await prismaClient.student.findUnique({
			where: {
				user_id_classroom_id: {
					user_id: userId,
					classroom_id: classroomId
				}
			},
			select: {
				student_id: true
			}
		})

		return student?.student_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
