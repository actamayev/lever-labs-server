import PrismaClientClass from "../../../classes/prisma-client"

export default async function doesUUIDUserRecordExist(userId: number, pipUUID: PipUUID): Promise<boolean> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const uuidUserRecord = await prismaClient.user_pip_uuid_map.findFirst({
			where: {
				user_id: userId,
				pip_uuid: {
					uuid: pipUUID
				}
			}
		})

		return uuidUserRecord !== null
	} catch (error) {
		console.error(error)
		throw error
	}
}
