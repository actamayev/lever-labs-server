import { ClassCode } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function getClassBelongsToTeacher(teacherId: number, classCode: ClassCode): Promise<boolean> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		// Single query: find teacher-classroom mapping where teacher matches
		// AND the classroom has the given class code
		const teacherClassroomMapping = await prismaClient.classroom_teacher_map.findFirst({
			where: {
				teacher_id: teacherId,
				classroom: {
					class_code: classCode
				}
			}
		})

		// Return true if mapping exists, false otherwise
		return teacherClassroomMapping !== null

	} catch (error) {
		console.error(error)
		throw error
	}
}
