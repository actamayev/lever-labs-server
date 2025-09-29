import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import { HubUUID } from "@lever-labs/common-ts/types/utils"
import HubManager from "../../classes/hub-manager"
import BrowserSocketManager from "../../classes/browser-socket-manager"
import retrieveUsername from "../../db-operations/read/credentials/retrieve-username"

export default async function sendDinoScore(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { score, hubId } = req.body as { score: number, hubId: HubUUID }

		let studentIds = await HubManager.getInstance().getStudentIdsByHubId(hubId)
		// filter out the userId
		studentIds = studentIds.filter(id => id !== userId)
		const username = await retrieveUsername(userId)
		if (!username) {
			res.status(400).json({ error: "Username not found" } satisfies ErrorResponse)
			return
		}
		// emit
		studentIds.forEach(studentId => {
			void BrowserSocketManager.getInstance().emitToUser(studentId, "dino-score-update-all-peers", { score, username })
		})

		res.status(200).json({ success: "Dino score sent" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to join classroom" } satisfies ErrorResponse)
		return
	}
}
