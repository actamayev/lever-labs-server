import PrismaClientClass from "../../../classes/prisma-client"

export default async function getNextHintNumber(
	challengeId: number,
	userId: number
): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		// Get the active chat to determine session start time
		const activeChat = await prismaClient.career_quest_chat.findFirst({
			where: {
				challenge_id: challengeId,
				user_id: userId,
				is_active: true
			},
			select: {
				created_at: true
			}
		})

		// No active chat, start at 1
		if (!activeChat) return 1

		// Count hints created since this chat session started
		const hintCount = await prismaClient.career_quest_hint.count({
			where: {
				challenge_id: challengeId,
				user_id: userId,
				created_at: {
					gte: activeChat.created_at
				}
			}
		})

		return hintCount + 1
	} catch (error) {
		console.error("Error getting next hint number:", error)
		throw error
	}
}
