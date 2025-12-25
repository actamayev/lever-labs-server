import { isDate } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, MessageResponse } from "@actamayev/lever-labs-common-ts/types/api"
import retrieveStudentClassroomStatus from "../../db-operations/read/student/retrieve-student-classroom-status"

export default async function confirmUserIsNotInClassroom(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { userId, classroomId } = req

		const joinedDate = await retrieveStudentClassroomStatus(userId, classroomId)

		if (isDate(joinedDate)) { //If joined Date exists, that means the user has already joined the class
			res.status(400).json({ message: "You are already in this class" } satisfies MessageResponse)
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm user is not already in class" } satisfies ErrorResponse)
		return
	}
}
