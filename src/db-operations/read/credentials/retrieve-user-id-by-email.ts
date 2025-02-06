import isNull from "lodash-es/isNull"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveUserIdByEmail(encryptedEmail: DeterministicEncryptedString): Promise<number | null | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const user = await prismaClient.credentials.findFirst({
			where: {
				email__encrypted: {
					equals: encryptedEmail
				}
			},
			select: {
				user_id: true,
				is_active: true
			}
		})

		if (isNull(user)) return null

		if (user.is_active === false) return undefined

		return user.user_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
