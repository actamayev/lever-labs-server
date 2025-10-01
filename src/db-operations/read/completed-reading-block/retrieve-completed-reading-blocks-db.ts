import { ActivityUUID } from "@lever-labs/common-ts/types/lab"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function retrieveCompletedReadingBlocksDB(userId: number, readingId: ActivityUUID): Promise<string[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const retrievedCompletedReadingBlocks = await prismaClient.completed_reading_block.findMany({
			where: {
				user_id: userId,
				reading_block: {
					reading: {
						activity_id: readingId
					}
				}
			},
			select: {
				reading_block: {
					select: {
						reading_block_name: true
					}
				}
			}
		})

		return retrievedCompletedReadingBlocks.map(
			retrievedCompletedReadingBlock => retrievedCompletedReadingBlock.reading_block.reading_block_name
		)
	} catch (error) {
		console.error(error)
		throw error
	}
}
