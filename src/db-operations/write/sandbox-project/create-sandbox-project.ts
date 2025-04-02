import PrismaClientClass from "../../../classes/prisma-client"

export default async function createSandboxProjectDB(userId: number): Promise<ProjectUUID> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const uuid = crypto.randomUUID()
		await prismaClient.sandbox_project.create({
			data: {
				sandbox_xml: "<xml xmlns=\"https://developers.google.com/blockly/xml\"/>",
				project_owner_id: userId,
				project_uuid: uuid
			}
		})

		return uuid
	} catch (error) {
		console.error(error)
		throw error
	}
}
