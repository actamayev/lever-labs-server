import PrismaClientClass from "../../../classes/prisma-client"

export default async function addPipUUIDRecord(pipUUID: PipUUID): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.pip_uuid.create({
			data: {
				uuid: pipUUID
			}
		})
	} catch (error) {
		console.error("Error adding Pip UUID record:", error)
		throw error
	}
}
