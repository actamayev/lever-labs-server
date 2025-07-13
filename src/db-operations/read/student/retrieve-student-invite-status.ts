import { InvitationStatus } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveStudentInviteStatus(studentId: number): Promise<InvitationStatus | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const studentStatus = await prismaClient.student.findUnique({
			where: {
				student_id: studentId
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
