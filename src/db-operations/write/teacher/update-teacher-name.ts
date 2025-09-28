import { TeacherName } from "@lever-labs/common-ts/types/teacher"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateTeacherName(
	userId: number,
	teacherNameData: TeacherName
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.teacher.update({
			where: {
				user_id: userId
			},
			data: {
				teacher_first_name: teacherNameData.teacherFirstName,
				teacher_last_name: teacherNameData.teacherLastName
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
