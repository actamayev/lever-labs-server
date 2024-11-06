import PrismaClientClass from "../../../classes/prisma-client"
import Esp32SocketManager from "../../../classes/esp32-socket-manager"

export default async function retrieveUserPipUUIDsDetails(userId: number): Promise<PipData[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const retrievedUserPipUUIDs = await prismaClient.user_pip_uuid_map.findMany({
			where: {
				user_id: userId,
				is_active: true
			},
			select: {
				pip_name: true,
				pip_uuid_id: true,
				pip_uuid: {
					select: {
						uuid: true
					}
				}
			}
		})

		return retrievedUserPipUUIDs.map(item => ({
			pipName: item.pip_name,
			userPipUUIDId: item.pip_uuid_id,
			pipUUID: item.pip_uuid.uuid as PipUUID,
			pipConnectionStatus: Esp32SocketManager.getInstance().getPreviouslyConnectedPipUUID(item.pip_uuid.uuid as PipUUID).status
		}))
	} catch (error) {
		console.error(error)
		throw error
	}
}
