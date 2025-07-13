import { IncomingTeacherRequestData } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function addTeacherUpdateUser(
	userId: number,
	becomeTeacherData: IncomingTeacherRequestData
): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()

	await prismaClient.$transaction(async (prisma) => {
		// Upsert school
		const school = await prisma.school.upsert({
			where: { school_name: becomeTeacherData.schoolName },
			update: {}, // No updates needed if exists
			create: { school_name: becomeTeacherData.schoolName }
		})

		// Create teacher
		await prisma.teacher.create({
			data: {
				user_id: userId,
				teacher_first_name: becomeTeacherData.teacherFirstName,
				teacher_last_name: becomeTeacherData.teacherLastName,
				school_id: school.school_id
			}
		})
	})
}
