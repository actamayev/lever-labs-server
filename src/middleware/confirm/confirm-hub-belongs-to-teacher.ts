import { Request, Response, NextFunction } from "express"
import { ErrorResponse, MessageResponse } from "@bluedotrobots/common-ts/types/api"
import { HubUUID } from "@bluedotrobots/common-ts/types/utils"
import HubManager from "../../classes/hub-manager"

export default function confirmHubBelongsToTeacher(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const { userId } = req
		const { hubId } = req.body as { hubId: HubUUID }

		const doesClassBelongToTeacher = HubManager.getInstance().doesHubBelongToTeacher(hubId, userId)

		 if (doesClassBelongToTeacher === false) {
			res.status(400).json({ message: "You are not a teacher for this hub"} satisfies MessageResponse)
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({
			error: "Internal Server Error: Unable to confirm if user is a teacher of this hub"
		} satisfies ErrorResponse)
		return
	}
}
