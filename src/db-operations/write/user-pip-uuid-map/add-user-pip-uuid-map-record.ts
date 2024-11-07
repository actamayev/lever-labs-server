import PrismaClientClass from "../../../classes/prisma-client"

export default async function addUserPipUUIDMapRecord(
	userId: number,
	pipName: string,
	pipUUIDId: number
): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const result = await prismaClient.user_pip_uuid_map.create({
			data: {
				user_id: userId,
				pip_name: pipName,
				pip_uuid_id: pipUUIDId
			}
		})

		return result.user_pip_uuid_map_id
	} catch (error) {
		console.error("Error adding Pip UUID map record:", error)
		throw error
	}
}
