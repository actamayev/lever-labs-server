import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveUserIdByUsername(username: string): Promise<number | undefined> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const user = await prismaClient.credentials.findFirst({
			where: {
				username: {
					equals: username,
					mode: "insensitive"
				}
			},
			select: {
				user_id: true
			}
		})

		return user?.user_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
