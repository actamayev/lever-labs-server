import { Response, Request } from "express"
import { SuccessResponse, ErrorResponse, ClassCode, CareerUUID } from "@bluedotrobots/common-ts"
import HubManager from "../../classes/hub-manager"
import { randomUUID } from "crypto"

export default function createHub(req: Request, res: Response): void {
	try {
		const { teacherId } = req
		const hubId = randomUUID()
		const { classCode } = req.params as { classCode: ClassCode }
		const { hubName, careerUUID, slideId } = req.body as { hubName: string, careerUUID: CareerUUID, slideId: string }

		HubManager.getInstance().createHub(hubId, { teacherId, hubName, classCode, careerUUID, slideId, studentsJoined: [] })
		res.status(200).json({ success: "Hub created" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to create hub" } satisfies ErrorResponse)
		return
	}
}
