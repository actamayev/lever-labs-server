import { Response, Request } from "express"
import { ClassCodeResponse, ErrorResponse } from "@lever-labs/common-ts/types/api"
import { ClassCode } from "@lever-labs/common-ts/types/utils"
import generateClassroomCode from "../../utils/generate/generate-classroom-code"
import addClassroom from "../../db-operations/write/simultaneous-writes/add-classroom"

export default async function createClassroom(req: Request, res: Response): Promise<void> {
	try {
		const { teacherId } = req
		const { classroomName } = req.body as { classroomName: string }

		let classCode: ClassCode

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		while (true) {
			classCode = generateClassroomCode()
			const success = await addClassroom(classroomName, classCode, teacherId)
			if (success) break // Exit loop if the classroom was successfully created
		}

		res.status(200).json({ classCode } satisfies ClassCodeResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to create classroom" } satisfies ErrorResponse)
		return
	}
}
