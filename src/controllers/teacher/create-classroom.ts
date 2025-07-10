import { Response, Request } from "express"
import { ClassCode, ClassCodeResponse, ErrorResponse, IncomingClassroomData } from "@bluedotrobots/common-ts"
import generateClassroomCode from "../../utils/generate-classroom-code"
import addClassroom from "../../db-operations/write/simultaneous-writes/add-classroom"

// Modified controller
export default async function createClassroom(req: Request, res: Response): Promise<void> {
	try {
		const { teacherId } = req
		const classroomData = req.body as IncomingClassroomData

		let classCode: ClassCode

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		while (true) {
			classCode = generateClassroomCode()
			const success = await addClassroom({ ...classroomData, classCode }, teacherId)
			if (success) break // Exit loop if the classroom was successfully created
		}

		res.status(200).json({ classCode } as ClassCodeResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to create classroom" } as ErrorResponse)
		return
	}
}
