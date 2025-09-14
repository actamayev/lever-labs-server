import PrismaClientClass from "../../../classes/prisma-client"

export default async function getClassBelongsToTeacher(teacherId: number, classroomId: number): Promise<boolean> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const teacherClassroomMapping = await prismaClient.classroom_teacher_map.findFirst({
			where: {
				teacher_id: teacherId,
				classroom_id: classroomId
			}
		})

		// Return true if mapping exists, false otherwise
		return teacherClassroomMapping !== null
	} catch (error) {
		console.error(error)
		throw error
	}
}
