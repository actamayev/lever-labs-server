import { TeacherName } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function getTeacherName(teacherId: number): Promise<TeacherName | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const teacherName = await prismaClient.teacher.findUnique({
			where: {
				user_id: teacherId
			},
			select: {
				teacher_first_name: true,
				teacher_last_name: true,
			}
		})

		return teacherName ? {
			teacherFirstName: teacherName.teacher_first_name,
			teacherLastName: teacherName.teacher_last_name
		} : null
	} catch (error) {
		console.error(error)
		throw error
	}
}
