import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateCareerUserProgressDB(
	userId: number,
	careerId: number,
	currentId: string
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
				challenge_uuid_or_text_uuid: currentId,
			},
			create: {
				user_id: userId,
				career_id: careerId,
				challenge_uuid_or_text_uuid: currentId,
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
