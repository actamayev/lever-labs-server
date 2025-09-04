
import PrismaClientClass from "../../../classes/prisma-client"

export default async function getClassroomStudentIds(classroomId: number): Promise<number[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const studentIds = await prismaClient.student.findMany({
			where: {
				classroom_id: classroomId
			},
			select: {
				student_id: true
			}
		})

		return studentIds.map(student => student.student_id)
	} catch (error) {
		console.error(error)
		throw error
	}
}
