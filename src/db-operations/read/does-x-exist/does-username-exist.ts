import PrismaClientClass from "../../../classes/prisma-client"

export default async function doesUsernameExist(username: string): Promise<boolean> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const user = await prismaClient.credentials.findFirst({
			where: {
				username: {
					equals: username,
					mode: "insensitive"
				}
			}
		})

		return user !== null
	} catch (error) {
		console.error(error)
		throw error
	}
}
