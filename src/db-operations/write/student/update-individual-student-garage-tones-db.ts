import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateIndividualStudentGarageTones(
	studentId: number,
	garageTonesStatus: boolean
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.student.update({
			where: {
				student_id: studentId
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
