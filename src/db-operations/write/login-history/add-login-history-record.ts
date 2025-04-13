import PrismaClientClass from "../../../classes/prisma-client"

export default async function addLoginHistoryRecord(userId: number): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.login_history.create({
			data: {
				user_id: userId
			}
		})
	} catch (error) {
		console.error("Error adding login record:", error)
		throw error
	}
}
