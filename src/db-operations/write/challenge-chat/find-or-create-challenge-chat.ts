import PrismaClientClass from "../../../classes/prisma-client"

export default async function findOrCreateChallengeChat(userId: number, challengeId: number): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		// First, try to find an existing active challenge chat
		const existingChat = await prismaClient.challenge_chat.findFirst({
			where: {
				challenge_id: challengeId,
				user_id: userId,
				is_active: true
			},
			select: {
				challenge_chat_id: true,
			}
		})

		if (existingChat) {
			return existingChat.challenge_chat_id
		}

		// If no active chat exists, create a new one
		const newChat = await prismaClient.challenge_chat.create({
			data: {
				challenge_id: challengeId,
				user_id: userId
			},
			select: {
				challenge_chat_id: true,
			}
		})

		return newChat.challenge_chat_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
