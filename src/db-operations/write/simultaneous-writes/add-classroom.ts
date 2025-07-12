import PrismaClientClass from "../../../classes/prisma-client"

export default async function addClassroom(
	classroomName: string,
	classCode: string,
	teacherId: number
): Promise<boolean> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.$transaction(async (prisma) => {
			const createClassroomResponse = await prisma.classroom.create({
				data: {
					classroom_name: classroomName,
					class_code: classCode,
				}
			})

			await prisma.classroom_teacher_map.create({
				data: {
					classroom_id: createClassroomResponse.classroom_id,
					teacher_id: teacherId
				}
			})
		})
		return true
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		if (error.code === "P2002" && error.meta?.target?.includes("class_code")) {
			console.info("Class code conflict, signaling retry...")
			return false // Unique constraint violation, signal retry
		} else {
			console.error("Error adding classroom:", error)
			throw error // Other errors, rethrow to handle elsewhere
		}
	}
}
