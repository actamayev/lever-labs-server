import { InvitationStatus } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveStudentInviteStatus(
	studentId: number,
	classroomId: number
): Promise<InvitationStatus | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const studentStatus = await prismaClient.student.findUnique({
			where: {
				user_id_classroom_id: {
					user_id: studentId,
					classroom_id: classroomId
				}
			},
			select: {
				invitation_status: true
			}
		})

		return studentStatus?.invitation_status
	} catch (error) {
		console.error(error)
		throw error
	}
}
