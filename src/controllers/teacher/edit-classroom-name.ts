import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import { ClassCode } from "@lever-labs/common-ts/types/utils"
import updateClassroomName from "../../db-operations/write/classroom/update-classroom-name"

export default async function editClassroomName(req: Request, res: Response): Promise<void> {
	try {
		const { classCode } = req.params as { classCode: ClassCode }
		const { classroomName } = req.body as { classroomName: string }

		await updateClassroomName(classCode, classroomName)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to edit classroom name" } satisfies ErrorResponse)
		return
	}
}
