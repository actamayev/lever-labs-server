import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveUserPipUUIDs(userId: number): Promise<PipUUID[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const retrievedUserPipUUIDs = await prismaClient.user_pip_uuid_map.findMany({
			where: {
				user_id: userId,
				is_active: true
			},
			select: {
				pip_uuid: {
					select: {
						uuid: true
					}
				}
			}
		})

		return retrievedUserPipUUIDs.map(item => (item.pip_uuid.uuid as PipUUID))
	} catch (error) {
		console.error(error)
		throw error
	}
}
