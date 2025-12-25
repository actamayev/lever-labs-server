import { PipUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import SecretsManager from "../../../classes/aws/secrets-manager"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function addPipUUIDRecord(uuid: PipUUID): Promise<boolean> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const hardwareVersion = await SecretsManager.getInstance().getSecret("PIP_HARDWARE_VERSION")

		await prismaClient.pip_uuid.create({
			data: {
				uuid,
				hardware_version: hardwareVersion
			}
		})
		return true
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		if (error.code === "P2002" && error.meta?.target?.includes("uuid")) {
			console.info("UUID conflict, generating a new UUID and retrying...")
			return false // Unique constraint violation, signal retry
		} else {
			console.error("Error adding Pip UUID record:", error)
			throw error // Other errors, rethrow to handle elsewhere
		}
	}
}
