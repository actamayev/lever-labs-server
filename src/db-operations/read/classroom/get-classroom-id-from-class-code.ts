import { ClassCode } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function getClassroomIdFromClassCode(classCode: ClassCode): Promise<number | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const classroomId = await prismaClient.classroom.findUnique({
			select: {
				classroom_id: true
			},
			where: {
				class_code: classCode
			}
		})
		return classroomId?.classroom_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
