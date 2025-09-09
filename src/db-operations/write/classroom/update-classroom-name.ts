import { ClassCode } from "@bluedotrobots/common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateClassroomName(
	classCode: ClassCode,
	newClassroomName: string
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.classroom.update({
			where: {
				class_code: classCode
			},
			data: {
				classroom_name: newClassroomName,
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
