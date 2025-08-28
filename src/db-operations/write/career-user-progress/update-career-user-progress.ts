import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateCareerUserProgressDB(
	userId: number,
	careerId: number,
	currentId: string,
	isFurthestSeen: boolean
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.career_user_progress.upsert({
			where: {
				user_id_career_id: {
					user_id: userId,
					career_id: careerId,
				}
			},
			update: {
				current_challenge_uuid_or_text_uuid: currentId,
				furthest_seen_challenge_uuid_or_text_uuid: isFurthestSeen ? currentId : undefined
			},
			create: {
				user_id: userId,
				career_id: careerId,
				current_challenge_uuid_or_text_uuid: currentId,
				furthest_seen_challenge_uuid_or_text_uuid: currentId
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
