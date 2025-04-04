import PrismaClientClass from "../../../classes/prisma-client"
import camelCaseSandboxProject from "../../../utils/sandbox/camel-case-sandbox-project"

export default async function createSandboxProjectDB(userId: number): Promise<SandboxProject> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const uuid = crypto.randomUUID()
		const defaultSandboxXml = "<xml xmlns=\"https://developers.google.com/blockly/xml\"/>"
		const sandboxProject = await prismaClient.sandbox_project.create({
			data: {
				sandbox_xml: defaultSandboxXml,
				project_owner_id: userId,
				project_uuid: uuid
			}
		})

		return camelCaseSandboxProject(sandboxProject)
	} catch (error) {
		console.error(error)
		throw error
	}
}
