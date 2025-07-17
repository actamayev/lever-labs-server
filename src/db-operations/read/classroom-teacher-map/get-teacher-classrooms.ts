import { BasicTeacherClassroomData, ClassCode } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function getTeacherClassrooms(teacherId: number): Promise<BasicTeacherClassroomData[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const classrooms = await prismaClient.classroom_teacher_map.findMany({
			where: {
				teacher_id: teacherId,
			},
			select: {
				classroom: {
					select: {
						classroom_name: true,
						class_code: true
					}
				}
			}
		})

		return classrooms.map(item => ({
			classroomName: item.classroom.classroom_name,
			classCode: item.classroom.class_code as ClassCode
		}) satisfies BasicTeacherClassroomData)
	} catch (error) {
		console.error(error)
		throw error
	}
}
