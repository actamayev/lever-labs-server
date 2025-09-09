import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts/types/api"

export default async function playSoundToAll (_req: Request, res: Response): Promise<void> {
	try {
		await SendEsp32MessageManager.getInstance().playSoundToAll()

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to play sound on all devices" } satisfies ErrorResponse)
		return
	}
}
