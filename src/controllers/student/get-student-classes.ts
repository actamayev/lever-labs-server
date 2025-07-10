import { Response, Request } from "express"
import { ErrorResponse, StudentClassroomData } from "@bluedotrobots/common-ts"
import retrieveStudentClasses from "../../db-operations/read/credentials/retrieve-student-classes"

export default async function getStudentClasses(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req

		const studentClasses = await retrieveStudentClasses(userId)

		res.status(200).json(studentClasses as StudentClassroomData[])
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to join classroom" } as ErrorResponse)
		return
	}
}
