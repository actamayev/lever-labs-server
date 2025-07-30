
import PrismaClientClass from "../../../classes/prisma-client"

interface AddCareerQuestHintData {
	challengeId: number
	userId: number
	hintText: string
	modelUsed: string
	hintNumber: number
}

export default async function addCareerQuestHint(data: AddCareerQuestHintData): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.career_quest_hint.create({
			data: {
				challenge_id: data.challengeId,
				user_id: data.userId,
				hint_text: data.hintText,
				model_used: data.modelUsed,
				hint_number: data.hintNumber
			}
		})
	} catch (error) {
		console.error("Error adding career quest hint:", error)
		throw error
	}
}
