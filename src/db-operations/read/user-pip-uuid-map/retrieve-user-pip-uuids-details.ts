import PrismaClientClass from "../../../classes/prisma-client"
import BrowserSocketManager from "../../../classes/browser-socket-manager"

export default async function retrieveUserPipUUIDsDetails(userId: number): Promise<PipData[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const retrievedUserPipUUIDs = await prismaClient.user_pip_uuid_map.findMany({
			where: {
				user_id: userId,
				is_active: true
			},
			select: {
				pip_uuid_id: true,
				pip_uuid: {
					select: {
						pip_name: true,
						uuid: true
					}
				}
			}
		})

		return retrievedUserPipUUIDs.map(item => ({
			pipName: item.pip_uuid.pip_name || "Pip",
			userPipUUIDId: item.pip_uuid_id,
			pipUUID: item.pip_uuid.uuid as PipUUID,
			pipConnectionStatus: BrowserSocketManager.getInstance().getLivePipStatus(userId, item.pip_uuid.uuid as PipUUID)
		}))
	} catch (error) {
		console.error(error)
		throw error
	}
}
