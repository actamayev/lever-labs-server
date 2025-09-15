import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateIndividualStudentGarageDisplay(
	studentId: number,
	garageDisplayStatus: boolean
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.student.update({
			where: {
				student_id: studentId
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
