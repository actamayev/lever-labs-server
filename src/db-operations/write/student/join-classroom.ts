import { InvitationMethod } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function joinClassroom(
	studentId: number,
	classroomId: number,
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.student.upsert({
			where: {
				user_id_classroom_id: {
					user_id: studentId,
					classroom_id: classroomId
				}
			},
			create: {
				user_id: studentId,
				classroom_id: classroomId,
				invitation_method: InvitationMethod.CLASS_CODE,
				joined_classroom_at: new Date()
			},
			update: {
				teacher_id_invited: undefined,
				invitation_method: InvitationMethod.CLASS_CODE,
				joined_classroom_at: new Date()
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
