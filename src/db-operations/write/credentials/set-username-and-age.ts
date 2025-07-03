import PrismaClientClass from "../../../classes/prisma-client"

export default async function setUsernameAndAge(
	userId: number,
	username: string,
	age: number
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.credentials.update({
			where: {
				user_id: userId
			},
			data: {
				username,
				age
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
