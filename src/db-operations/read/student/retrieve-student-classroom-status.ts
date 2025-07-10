import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveStudentClassroomStatus(
	studentId: number,
	classroomId: number
): Promise<Date | null | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const studentStatus = await prismaClient.student.findUnique({
			where: {
				user_id_classroom_id: {
					user_id: studentId,
					classroom_id: classroomId
				}
			},
			select: {
				joined_classroom_at: true
			}
		})

		return studentStatus?.joined_classroom_at
	} catch (error) {
		console.error(error)
		throw error
	}
}
