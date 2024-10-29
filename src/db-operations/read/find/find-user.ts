import _ from "lodash"
import PrismaClientClass from "../../../classes/prisma-client"
import { validateExtendedCredentials } from "../../../utils/type-guards"

export async function findUserById(userId: number): Promise<ExtendedCredentials | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const user = await prismaClient.credentials.findUnique({
			where: {
				user_id: userId,
				is_active: true
			}
		})

		if (_.isNull(user) || validateExtendedCredentials(user) === false) return null

		return user
	} catch (error) {
		console.error("Error finding user by Id:", error)
		throw error
	}
}

export async function findUserByWhereCondition(
	whereCondition:
		{ username?: { equals: string, mode: "insensitive" } } |
		{ email__encrypted?: { equals: DeterministicEncryptedString } }
): Promise<ExtendedCredentials | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const user = await prismaClient.credentials.findFirst({
			where: { ...whereCondition, is_active: true }
		})

		if (_.isNull(user) || validateExtendedCredentials(user) === false) return null

		return user
	} catch (error) {
		console.error("Error finding user:", error)
		throw error
	}
}
