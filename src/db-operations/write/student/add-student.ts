import { InvitationMethod, InvitationStatus } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function addStudent(
	teacherId: number,
	classroomId: number,
	newStudentId: number
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.student.upsert({
			where: {
				user_id_classroom_id: {
					user_id: newStudentId,
					classroom_id: classroomId,
				}
			},
			create: {
				user_id: newStudentId,
				classroom_id: classroomId,
				teacher_id_invited: teacherId,
				invitation_method: InvitationMethod.TEACHER_INVITE,
				invitation_status: InvitationStatus.PENDING
			},
			update: {
				invitation_method: InvitationMethod.TEACHER_INVITE,
				invitation_status: InvitationStatus.PENDING
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
