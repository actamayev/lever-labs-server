import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateGarageDisplayAllStudents(
	classroomId: number,
	garageDisplayStatus: boolean
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.student.updateMany({
			where: {
				classroom_id: classroomId
			},
			data: {
				garage_display_allowed: garageDisplayStatus
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
