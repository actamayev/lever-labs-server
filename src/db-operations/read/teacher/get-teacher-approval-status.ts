import PrismaClientClass from "../../../classes/prisma-client"

export default async function getTeacherApprovalStatus(userId: number): Promise<boolean | null | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const teacher = await prismaClient.teacher.findUnique({
			where: {
				user_id: userId
			},
			select: {
				is_approved: true
			}
		})

		return teacher?.is_approved
	} catch (error) {
		console.error(error)
		throw error
	}
}
