import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveUsername(userId: number): Promise<string | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const username = await prismaClient.credentials.findUnique({
			where: {
				user_id: userId
			},
			select: {
				username: true
			}
		})
		return username?.username || undefined
	} catch (error) {
		console.error(error)
		throw error
	}
}
