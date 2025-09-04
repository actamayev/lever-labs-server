import { InvitationMethod, InvitationStatus } from "@prisma/client"
import { ClassCode, StudentClassroomData } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"
import HubManager from "../../../classes/hub-manager"

// eslint-disable-next-line max-lines-per-function
export default async function joinClassroom(
	studentId: number,
	classroomId: number
): Promise<StudentClassroomData> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const result = await prismaClient.student.upsert({
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
				invitation_status: InvitationStatus.ACCEPTED,
				joined_classroom_at: new Date()
			},
			update: {
				teacher_id_invited: undefined,
				invitation_method: InvitationMethod.CLASS_CODE,
				invitation_status: InvitationStatus.ACCEPTED,
				joined_classroom_at: new Date()
			},
			include: {
				classroom: true
			}
		})

		return {
			invitationStatus: "ACCEPTED",
			joinedClassroomAt: result.joined_classroom_at,
			classroomName: result.classroom.classroom_name,
			classCode: result.classroom.class_code as ClassCode,
			activeHubs: HubManager.getInstance().getClassroomActiveHubs(result.classroom.class_code as ClassCode)
		}
	} catch (error) {
		console.error(error)
		throw error
	}
}
