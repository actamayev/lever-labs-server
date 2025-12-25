import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { ErrorResponse, SuccessResponse } from "@actamayev/lever-labs-common-ts/types/api"

export default async function playToneToAll(_req: Request, res: Response): Promise<void> {
	try {
		await SendEsp32MessageManager.getInstance().playToneToAll()

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to play tone on all devices" } satisfies ErrorResponse)
		return
	}
}
