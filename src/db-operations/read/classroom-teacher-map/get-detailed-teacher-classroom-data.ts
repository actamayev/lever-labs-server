import { ClassCode, DetailedClassroomData, StudentData } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"
import HubManager from "../../../classes/hub-manager"

export default async function getDetailedTeacherClassroomData(
	teacherId: number,
	userId: number
): Promise<DetailedClassroomData[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const classrooms = await prismaClient.classroom_teacher_map.findMany({
			where: {
				teacher_id: teacherId,
			},
			select: {
				classroom: {
					select: {
						classroom_name: true,
						class_code: true,
						student: {
							select: {
								invitation_status: true,
								user: {
									select: {
										username: true
									}
								}
							}
						}
					},
				}
			}
		})

		return classrooms.map(item => ({
			classroomName: item.classroom.classroom_name,
			classCode: item.classroom.class_code as ClassCode,
			students: item.classroom.student.map(student => ({
				username: student.user.username || "",
				inviteStatus: student.invitation_status
			}) satisfies StudentData),
			activeHubs: HubManager.getInstance().getTeacherHubs(userId)
		}) satisfies DetailedClassroomData)
	} catch (error) {
		console.error(error)
		throw error
	}
}
