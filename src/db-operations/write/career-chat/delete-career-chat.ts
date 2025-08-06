import PrismaClientClass from "../../../classes/prisma-client"

export default async function deleteCareerChat(userId: number, careerId: number): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.career_chat.updateMany({
			where: {
				career_id: careerId,
				user_id: userId,
				is_active: true
			},
			data: {
				is_active: false
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
