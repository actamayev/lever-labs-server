import { isNull } from "lodash"
import PrismaClientClass from "../../../classes/prisma-client"

interface TeacherApprovalStatusAndId {
	isApproved: boolean | null
	teacherId: number
}

export default async function getTeacherApprovalStatusAndTeacherId(userId: number): Promise<TeacherApprovalStatusAndId | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const teacher = await prismaClient.teacher.findUnique({
			where: {
				user_id: userId
			},
			select: {
				is_approved: true,
				teacher_id: true
			}
		})

		return isNull(teacher) ? null : {
			isApproved: teacher.is_approved,
			teacherId: teacher.teacher_id
		}
	} catch (error) {
		console.error(error)
		throw error
	}
}
