import { isNull } from "lodash"
import { DetailedClassroomData } from "@bluedotrobots/common-ts/types/api"
import { ClassCode } from "@bluedotrobots/common-ts/types/utils"
import HubManager from "../../../classes/hub-manager"
import PrismaClientClass from "../../../classes/prisma-client"

// eslint-disable-next-line max-lines-per-function
export default async function getDetailedTeacherClassroomData(
	teacherId: number,
	userId: number,
	classroomId: number
): Promise<DetailedClassroomData | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const classroom = await prismaClient.classroom_teacher_map.findUnique({
			where: {
				classroom_id_teacher_id: {
					teacher_id: teacherId,
					classroom_id: classroomId
				}
			},
			select: {
				classroom: {
					select: {
						classroom_name: true,
						class_code: true,
						student: {
							select: {
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

		if (isNull(classroom)) return null

		return {
			classroomName: classroom.classroom.classroom_name,
			classCode: classroom.classroom.class_code as ClassCode,
			students: classroom.classroom.student.map(student => ({
				username: student.user.username || "",
			})),
			activeHubs: HubManager.getInstance().getTeacherHubs(userId)
		} satisfies DetailedClassroomData
	} catch (error) {
		console.error(error)
		throw error
	}
}
