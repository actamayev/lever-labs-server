import PrismaClientClass from "../../../classes/prisma-client"

export default async function updatePassword(userId: number, newPassword: string): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.credentials.update({
			where: {
				user_id: userId
			},
			data: {
				password: newPassword
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
