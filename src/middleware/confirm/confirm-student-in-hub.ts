import { Request, Response, NextFunction } from "express"
import { ErrorResponse, MessageResponse } from "@lever-labs/common-ts/types/api"
import { HubUUID } from "@lever-labs/common-ts/types/utils"
import HubManager from "../../classes/hub-manager"

export default function confirmStudentInHub(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const { studentId } = req
		const { hubId } = req.body as { hubId: HubUUID }

		const isStudentInHub = HubManager.getInstance().checkIfStudentInHub(hubId, studentId)

		 if (isStudentInHub === false) {
			res.status(400).json({ message: "You are not in this hub"} satisfies MessageResponse)
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to confirm if user is in this hub"
		} satisfies ErrorResponse)
		return
	}
}
