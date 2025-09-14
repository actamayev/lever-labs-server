import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateGarageLightsAllStudents(
	classroomId: number,
	garageLightsStatus: boolean
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.student.updateMany({
			where: {
				classroom_id: classroomId
			},
			data: {
				garage_lights_allowed: garageLightsStatus
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
