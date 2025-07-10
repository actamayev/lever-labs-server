import { DetailedClassroomData } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

// eslint-disable-next-line max-lines-per-function
export default async function getDetailedTeacherClassroomData(teacherId: number): Promise<DetailedClassroomData[]> {
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
						classroom_description: true,
						class_code: true,
						student: {
							select: {
								accepted_at: true,
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
			classroomDescription: item.classroom.classroom_description,
			classCode: item.classroom.class_code,
			students: item.classroom.student.map(student => ({
				username: student.user.username || "",
				didAccept: student.accepted_at !== null
			}))
		}))
	} catch (error) {
		console.error(error)
		throw error
	}
}
