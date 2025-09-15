import { StudentClassroomData } from "@bluedotrobots/common-ts/types/api"
import { ClassCode } from "@bluedotrobots/common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"
import HubManager from "../../../classes/hub-manager"

export default async function joinClassroom(
	studentId: number,
	classroomId: number
): Promise<StudentClassroomData> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const result = await prismaClient.student.create({
			data: {
				user_id: studentId,
				classroom_id: classroomId,
				joined_classroom_at: new Date()
			},
			include: {
				classroom: true
			}
		})

		return {
			studentId: result.student_id,
			joinedClassroomAt: result.joined_classroom_at,
			classroomName: result.classroom.classroom_name,
			classCode: result.classroom.class_code as ClassCode,
			activeHubs: HubManager.getInstance().getClassroomActiveHubs(result.classroom.class_code as ClassCode),
			garageDrivingAllowed: result.garage_driving_allowed,
			garageSoundsAllowed: result.garage_sounds_allowed,
			garageLightsAllowed: result.garage_lights_allowed,
			garageDisplayAllowed: result.garage_display_allowed
		}
	} catch (error) {
		console.error(error)
		throw error
	}
}
