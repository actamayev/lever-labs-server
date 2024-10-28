import PrismaClientClass from "../../../classes/prisma-client"

interface RetrievedUserPipUUIDs {
	pip_uuid: {
        uuid: string
    }
}

export default async function retrieveUserPipUUIDs(userId: number): Promise<RetrievedUserPipUUIDs[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		return await prismaClient.user_pip_uuid_map.findMany({
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
	} catch (error) {
		console.error(error)
		throw error
	}
}
