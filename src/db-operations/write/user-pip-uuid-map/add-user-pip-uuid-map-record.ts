import PrismaClientClass from "../../../classes/prisma-client"

export default async function addUserPipUUIDMapRecord(
	userId: number,
	pipName: string,
	pipUUIDData: ExtendedPipUUID
): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const result = await prismaClient.$transaction(async (prisma) => {
			await prisma.pip_uuid.update({
				where: {
					uuid: pipUUIDData.uuid
				},
				data: {
					pip_name: pipName
				}
			})
			return await prisma.user_pip_uuid_map.create({
				data: {
					user_id: userId,
					pip_uuid_id: pipUUIDData.pip_uuid_id
				}
			})
		})

		return result.user_pip_uuid_map_id
	} catch (error) {
		console.error("Error adding Pip UUID map record:", error)
		throw error
	}
}
