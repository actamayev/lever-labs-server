import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateIndividualStudentGarageDriving(
	studentId: number,
	garageDrivingStatus: boolean
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.student.update({
			where: {
				student_id: studentId
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
