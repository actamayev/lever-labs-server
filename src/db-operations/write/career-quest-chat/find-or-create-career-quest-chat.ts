import { ChallengeId } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function findOrCreateCareerQuestChat(userId: number, challengeId: ChallengeId): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		// First, try to find an existing active career quest chat
		const existingChat = await prismaClient.career_quest_chat.findFirst({
			where: {
				challenge_id: challengeId,
				user_id: userId,
				is_active: true
			},
			select: {
				career_quest_chat_id: true,
			}
		})

		if (existingChat) {
			return existingChat.career_quest_chat_id
		}

		// If no active chat exists, create a new one
		const newChat = await prismaClient.career_quest_chat.create({
			data: {
				challenge_id: challengeId,
				user_id: userId
			},
			select: {
				career_quest_chat_id: true,
			}
		})

		return newChat.career_quest_chat_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
