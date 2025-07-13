import { Response, Request } from "express"
import EspLatestFirmwareManager from "../../classes/esp32/esp-latest-firmware-manager"
import { ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"
// This endpoint is hit by the Github action when it publishes a new build to the S3 bucket (staging & prod)
// This forces the server to fetch the latest firmware info
export default function forceFirmwareRefetch(_req: Request, res: Response): void {
	try {
		void EspLatestFirmwareManager.getInstance().retrieveLatestFirmwareInfo()

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve firmware update" } satisfies ErrorResponse)
		return
	}
}
