import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateSandboxNotesOpenStatus(userId: number, isOpen: boolean): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.credentials.update({
			where: {
				user_id: userId
			},
			data: {
				sandbox_notes_open: isOpen
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
