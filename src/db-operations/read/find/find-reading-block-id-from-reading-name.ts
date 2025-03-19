import PrismaClientClass from "../../../classes/prisma-client"

export default async function findReadingBlockIdFromReadingName(readingBlockName: string): Promise<number | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const retrievedReadingBlock = await prismaClient.reading_block.findFirst({
			where: {
				reading_block_name: readingBlockName
			}
		})

		return retrievedReadingBlock?.reading_block_id || null
	} catch (error) {
		console.error(error)
		throw error
	}
}
