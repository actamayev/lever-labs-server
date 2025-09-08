import { ClassCode, StudentClassroomData } from "@bluedotrobots/common-ts"
import HubManager from "../../../classes/hub-manager"
import PrismaClientClass from "../../../classes/prisma-client"

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
						}
					}
				}
			}
		})

		return studentData?.student.map(singleStudentData => ({
			joinedClassroomAt: singleStudentData.joined_classroom_at,
			classroomName: singleStudentData.classroom.classroom_name,
			classCode: singleStudentData.classroom.class_code as ClassCode,
			activeHubs: HubManager.getInstance().getStudentHubs(singleStudentData.classroom.class_code as ClassCode)
		}) satisfies StudentClassroomData) || []
	} catch (error) {
		console.error(error)
		throw error
	}
}
