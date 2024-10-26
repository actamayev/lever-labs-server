import PrismaClientClass from "../../../classes/prisma-client"

export default async function addUser(userFields: NewLocalUserFields): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const user = await prismaClient.credentials.create({
			data: userFields
		})

		return user.user_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
