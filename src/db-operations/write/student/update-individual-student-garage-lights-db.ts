import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateIndividualStudentGarageLights(
	studentId: number,
	garageLightsStatus: boolean
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.student.update({
			where: {
				student_id: studentId
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
