import PrismaClientClass from "../../../classes/prisma-client"

export default async function findOrCreateCareerChat(userId: number, careerId: number): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		// First, try to find an existing active challenge chat
		const existingChat = await prismaClient.career_chat.findFirst({
			where: {
				career_id: careerId,
				user_id: userId,
				is_active: true
			},
			select: {
				career_chat_id: true,
			}
		})

		if (existingChat) {
			return existingChat.career_chat_id
		}

		// If no active chat exists, create a new one
		const newChat = await prismaClient.career_chat.create({
			data: {
				career_id: careerId,
				user_id: userId
			},
			select: {
				career_chat_id: true,
			}
		})

		return newChat.career_chat_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
