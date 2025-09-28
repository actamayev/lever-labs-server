import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { LedControlData } from "@lever-labs/common-ts/types/garage"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"

// This is an internal route to send LED colors to all connected ESP32 devices
export default async function displayLedColorsToAll (req: Request, res: Response): Promise<void> {
	try {
		const body = req.body as Omit<LedControlData, "pipUUID">

		await SendEsp32MessageManager.getInstance().transferLedControlDataToAll(body)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to change led colors on all devices" } satisfies ErrorResponse)
		return
	}
}
