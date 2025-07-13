import PrismaClientClass from "../../../classes/prisma-client"

export default async function getClassroomName(classroomId: number): Promise<string | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const classroomName = await prismaClient.classroom.findUnique({
			where: {
				classroom_id: classroomId
			},
			select: {
				classroom_name: true
			},
		})
		return classroomName?.classroom_name
	} catch (error) {
		console.error(error)
		throw error
	}
}
