import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateGarageTonesAllStudents(
	classroomId: number,
	garageTonesStatus: boolean
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.student.updateMany({
			where: {
				classroom_id: classroomId
			},
			data: {
				garage_sounds_allowed: garageTonesStatus
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
