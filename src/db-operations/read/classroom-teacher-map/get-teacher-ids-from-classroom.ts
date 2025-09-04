import PrismaClientClass from "../../../classes/prisma-client"

export default async function getTeacherIdsFromClassroom(classroomId: number): Promise<number[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const teacherIds = await prismaClient.classroom_teacher_map.findMany({
			where: {
				classroom_id: classroomId
			},
			select: {
				teacher_id: true
			}
		})

		return teacherIds.map(teacher => teacher.teacher_id)
	} catch (error) {
		console.error(error)
		throw error
	}
}
