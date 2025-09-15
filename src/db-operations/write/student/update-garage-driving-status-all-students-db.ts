import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateGarageDrivingStatusAllStudents(
	classroomId: number,
	garageDrivingStatus: boolean
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.student.updateMany({
			where: {
				classroom_id: classroomId
			},
			data: {
				garage_driving_allowed: garageDrivingStatus
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
