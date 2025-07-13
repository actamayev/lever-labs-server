import { InvitationStatus } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveStudentInviteStatus(studentId: number): Promise<InvitationStatus | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const student = await prismaClient.student.findUnique({
			where: {
				student_id: studentId
			},
			select: {
				invitation_status: true
			}
		})

		return student?.invitation_status
	} catch (error) {
		console.error(error)
		throw error
	}
}
