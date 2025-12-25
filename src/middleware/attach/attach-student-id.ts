import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import retrieveStudentId from "../../db-operations/read/student/retrieve-student-id"
import { ErrorResponse, MessageResponse } from "@actamayev/lever-labs-common-ts/types/api"

export default async function attachStudentId(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { userId, classroomId } = req

		const studentId = await retrieveStudentId(userId, classroomId)

		if (isUndefined(studentId)) {
			res.status(400).json({ message: "This user is not a student" } satisfies MessageResponse)
			return
		}
		req.studentId = studentId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm if student exists" } satisfies ErrorResponse)
		return
	}
}
