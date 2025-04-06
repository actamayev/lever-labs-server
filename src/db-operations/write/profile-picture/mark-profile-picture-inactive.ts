import PrismaClientClass from "../../../classes/prisma-client"

export default async function markProfilePictureInactive(userId: number): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.profile_picture.update({
			where: {
				user_id: userId
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
