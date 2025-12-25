import { Request, Response, NextFunction } from "express"
import { ErrorResponse, MessageResponse } from "@actamayev/lever-labs-common-ts/types/api"
import { HubUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import HubManager from "../../classes/hub-manager"

export default async function confirmStudentNotInHub(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { studentId } = req
		const { hubId } = req.body as { hubId: HubUUID }

		const hubManager = await HubManager.getInstance()
		const isStudentInHub = await hubManager.checkIfStudentInHub(hubId, studentId)

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
