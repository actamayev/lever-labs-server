import PrismaClientClass from "../../../classes/prisma-client"

export default async function addCompletedReadingBlock(readingBlockId: number, userId: number): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.completed_reading_block.create({
			data: {
				reading_block_id: readingBlockId,
				user_id: userId
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
