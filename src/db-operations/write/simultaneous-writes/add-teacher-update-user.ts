import { IncomingTeacherRequestData } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

// eslint-disable-next-line max-lines-per-function
export default async function addTeacherUpdateUser(
	userId: number,
	becomeTeacherData: IncomingTeacherRequestData
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.$transaction(async (prisma) => {
			// Check if school exists, if not create it
			let school = await prisma.school.findUnique({
				where: {
					school_name: becomeTeacherData.schoolName
				}
			})

			if (!school) {
				school = await prisma.school.create({
					data: {
						school_name: becomeTeacherData.schoolName
					}
				})
			}

			// Create teacher record
			const teacher = await prisma.teacher.create({
				data: {
					user_id: userId,
					teacher_first_name: becomeTeacherData.teacherFirstName,
					teacher_last_name: becomeTeacherData.teacherLastName,
					school_id: school.school_id,
				}
			})

			// Update credentials to link to teacher
			await prisma.credentials.update({
				where: {
					user_id: userId
				},
				data: {
					teacher_id: teacher.teacher_id
				}
			})
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
