import { Request, Response, NextFunction } from "express"
import { ErrorResponse, MessageResponse } from "@lever-labs/common-ts/types/api"
import getClassBelongsToTeacher from "../../db-operations/read/classroom/get-class-belongs-to-teacher"

export default async function confirmClassBelongsToTeacher(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { teacherId, classroomId } = req

		const doesClassBelongToTeacher = await getClassBelongsToTeacher(teacherId, classroomId)

		 if (doesClassBelongToTeacher === false) {
			res.status(400).json({ message: "You are not a teacher for this class"} satisfies MessageResponse)
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to confirm if user is a teacher of this class"
		} satisfies ErrorResponse)
		return
	}
}
