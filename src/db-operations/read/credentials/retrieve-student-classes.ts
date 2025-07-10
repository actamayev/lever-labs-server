import { ClassCode, StudentClassroomData } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveStudentClasses(userId: number): Promise<StudentClassroomData[] | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const studentData = await prismaClient.credentials.findUnique({
			where: {
				user_id: userId
			},
			select: {
				student: {
					select: {
						invitation_status: true,
						joined_classroom_at: true,
						classroom: {
							select: {
								classroom_name: true,
								classroom_description: true,
								class_code: true
							}
						}
					}
				}
			}
		})

		return studentData?.student.map(singleStudentData => ({
			invitationStatus: singleStudentData.invitation_status,
			joinedClassroomAt: singleStudentData.joined_classroom_at,
			classroomName: singleStudentData.classroom.classroom_name,
			classroomDescription: singleStudentData.classroom.classroom_description,
			classCode: singleStudentData.classroom.class_code as ClassCode
		})) || []
	} catch (error) {
		console.error(error)
		throw error
	}
}
