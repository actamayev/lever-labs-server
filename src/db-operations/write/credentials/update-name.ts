import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateName(userId: number, name: string): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.credentials.update({
			where: {
				user_id: userId
			},
			data: {
				name
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
