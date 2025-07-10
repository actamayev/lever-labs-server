import PrismaClientClass from "../../../classes/prisma-client"

export default async function getTeacherName(teacherId: number): Promise<string | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const teacherName = await prismaClient.teacher.findUnique({
			where: {
				user_id: teacherId
			},
			select: {
				teacher_name: true
			}
		})

		return teacherName?.teacher_name
	} catch (error) {
		console.error(error)
		throw error
	}
}
