import { BasicTeacherClassroomData } from "@bluedotrobots/common-ts"
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
						classroom_description: true,
						class_code: true
					}
				}
			}
		})

		return classrooms.map(item => ({
			classroomName: item.classroom.classroom_name,
			classroomDescription: item.classroom.classroom_description,
			classCode: item.classroom.class_code
		}))
	} catch (error) {
		console.error(error)
		throw error
	}
}
