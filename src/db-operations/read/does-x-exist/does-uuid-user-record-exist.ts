import PrismaClientClass from "../../../classes/prisma-client"

export default async function doesUUIDUserRecordExist(userId: number, pipUUIDId: number): Promise<boolean> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const uuidUserRecord = await prismaClient.user_pip_uuid_map.findFirst({
			where: {
				user_id: userId,
				pip_uuid_id: pipUUIDId
			}
		})

		return uuidUserRecord !== null
	} catch (error) {
		console.error(error)
		throw error
	}
}
