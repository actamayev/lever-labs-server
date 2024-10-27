import PrismaClientClass from "../../../classes/prisma-client"

// TODO: Consider making pipUUID into it's own custom type
export default async function doesPipUUIDExist(pipUUID: string): Promise<boolean> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const pipUUIDRecord = await prismaClient.pip_uuid.findFirst({
			where: {
				uuid: pipUUID
			}
		})
		return pipUUIDRecord !== null
	} catch (error) {
		console.error(error)
		throw error
	}
}
