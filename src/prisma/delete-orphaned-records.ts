/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Deletes records from the database that don't exist in the source data
 * @param model - Prisma model delegate (e.g., prismaClient.career)
 * @param sourceData - Array of data from CSV/JSON
 * @param idField - Name of the ID field to compare
 * @param tableName - Human-readable table name for logging
 */
export default async function deleteOrphanedRecords<T extends Record<string, any>>(
	model: any,
	sourceData: T[],
	idField: keyof T,
	tableName: string
): Promise<void> {
	// Extract all IDs from source data
	const sourceIds = sourceData.map(item => item[idField]).filter(id => id !== undefined)

	// Get all existing IDs from database
	const existingRecords = await model.findMany({
		select: { [idField]: true }
	})
	const existingIds = existingRecords.map((r: any) => r[idField])

	// Find IDs to delete (in DB but not in source)
	const idsToDelete = existingIds.filter((id: any) => !sourceIds.includes(id))
	// if (tableName === "questions") {
	// 	console.log("idsToDelete", idsToDelete)
	// 	console.log("sourceIds", sourceIds)
	// 	console.log("existingIds", existingIds)
	// }

	// Delete orphaned records
	if (idsToDelete.length > 0) {
		await model.deleteMany({
			where: {
				[idField]: {
					in: idsToDelete
				}
			}
		})
		console.info(`🗑️  Deleted ${idsToDelete.length} orphaned ${tableName} record(s)`)
	}
}
