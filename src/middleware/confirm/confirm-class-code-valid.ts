import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ClassCode, ErrorResponse, MessageResponse} from "@bluedotrobots/common-ts"
import getClassroomIdFromClassCode from "../../db-operations/read/classroom/get-classroom-id-from-class-code"

export default async function confirmClassCodeValid(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { classCode } = req.body as { classCode: ClassCode }

		const classroomId = await getClassroomIdFromClassCode(classCode)

		if (isUndefined(classroomId)) {
			res.status(400).json({ message: "This class code does not exist" } as MessageResponse)
			return
		}
		req.classroomId = classroomId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm if class code is valid" } as ErrorResponse)
		return
	}
}
