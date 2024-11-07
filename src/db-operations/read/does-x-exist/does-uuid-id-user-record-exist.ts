import PrismaClientClass from "../../../classes/prisma-client"

export default async function doesUUIDIdUserRecordExist(userId: number, pipUUIDId: number): Promise<boolean> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const uuidIdUserRecord = await prismaClient.user_pip_uuid_map.findFirst({
			where: {
				user_id: userId,
				pip_uuid_id: pipUUIDId
			}
		})

		return uuidIdUserRecord !== null
	} catch (error) {
		console.error(error)
		throw error
	}
}
