import PrismaClientClass from "../../../classes/prisma-client"

export default async function getTeacherIdsFromClassroom(classroomId: number): Promise<number | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const teacherIds = await prismaClient.classroom_teacher_map.findFirst({
			where: {
				classroom_id: classroomId
			},
			select: {
				teacher: {
					select: {
						user: {
							select: {
								user_id: true
							}
						}
					}
				}
			}
		})

		return teacherIds?.teacher.user.user_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
