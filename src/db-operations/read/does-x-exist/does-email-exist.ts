import PrismaClientClass from "../../../classes/prisma-client"

export default async function doesEmailExist(encryptedEmail: DeterministicEncryptedString): Promise<boolean> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const user = await prismaClient.credentials.findFirst({
			where: {
				email__encrypted: encryptedEmail
			}
		})
		return user !== null
	} catch (error) {
		console.error(error)
		throw error
	}
}
