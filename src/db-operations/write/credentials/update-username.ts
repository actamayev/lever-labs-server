import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateUsername(userId: number, username: string): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.credentials.update({
			where: {
				user_id: userId
			},
			data: {
				username
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
