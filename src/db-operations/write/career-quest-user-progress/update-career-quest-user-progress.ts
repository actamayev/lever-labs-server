import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateCareerUserProgressDB(userId: number, careerId: number, challengeIdOrTextId: string): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.career_user_progress.create({
			data: {
				user_id: userId,
				career_id: careerId,
				challenge_id_or_text_id: challengeIdOrTextId
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
