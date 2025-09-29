import { StudentClassroomData } from "@lever-labs/common-ts/types/api"
import { ClassCode } from "@lever-labs/common-ts/types/utils"
import HubManager from "../../../classes/hub-manager"
import PrismaClientClass from "../../../classes/prisma-client"

// eslint-disable-next-line max-lines-per-function
export default async function retrieveStudentClasses(userId: number): Promise<StudentClassroomData[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const studentData = await prismaClient.credentials.findUnique({
			where: {
				user_id: userId
			},
			select: {
				student: {
					select: {
						joined_classroom_at: true,
						classroom: {
							select: {
								classroom_name: true,
								class_code: true
							}
						},
						student_id: true,
						garage_driving_allowed: true,
						garage_sounds_allowed: true,
						garage_lights_allowed: true,
						garage_display_allowed: true
					}
				}
			}
		})

		if (!studentData?.student) return []

		return await Promise.all(
			studentData.student.map(async singleStudentData => ({
				studentId: singleStudentData.student_id,
				joinedClassroomAt: singleStudentData.joined_classroom_at,
				classroomName: singleStudentData.classroom.classroom_name,
				classCode: singleStudentData.classroom.class_code as ClassCode,
				activeHubs: await HubManager.getInstance().getStudentHubs(singleStudentData.classroom.class_code as ClassCode),
				garageDrivingAllowed: singleStudentData.garage_driving_allowed,
				garageSoundsAllowed: singleStudentData.garage_sounds_allowed,
				garageLightsAllowed: singleStudentData.garage_lights_allowed,
				garageDisplayAllowed: singleStudentData.garage_display_allowed
			}) satisfies StudentClassroomData)
		)
	} catch (error) {
		console.error(error)
		throw error
	}
}
