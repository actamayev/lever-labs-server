import { Request, Response, NextFunction } from "express"
import { ErrorResponse, MessageResponse } from "@bluedotrobots/common-ts/types/api"
import { HubUUID } from "@bluedotrobots/common-ts/types/utils"
import HubManager from "../../classes/hub-manager"

export default function confirmStudentNotInHub(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const { studentId } = req
		const { hubId } = req.body as { hubId: HubUUID }

		const isStudentInHub = HubManager.getInstance().checkIfStudentInHub(hubId, studentId)

		 if (isStudentInHub === true) {
			res.status(400).json({ message: "You are already in this hub"} satisfies MessageResponse)
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to confirm if user is not in this hub"
		} satisfies ErrorResponse)
		return
	}
}
