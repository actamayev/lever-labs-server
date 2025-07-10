import { IncomingClassroomData } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

interface ExtendedIncomingClassroomData extends IncomingClassroomData {
	classCode: string
}

// Modified addClassroom function
export default async function addClassroom(
	classroomData: ExtendedIncomingClassroomData,
	teacherId: number
): Promise<boolean> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.$transaction(async (prisma) => {
			const createClassroomResponse = await prisma.classroom.create({
				data: {
					classroom_name: classroomData.classroomName,
					classroom_description: classroomData.classroomDescription,
					class_code: classroomData.classCode,
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
