import { Response, Request } from "express"
import EspLatestFirmwareManager from "../../classes/esp32/esp-latest-firmware-manager"

export default function readCurrentFirmwareVersion(_req: Request, res: Response): void {
	try {
		const currentFirmwareVersion = EspLatestFirmwareManager.getInstance().latestFirmwareVersion

		res.status(200).json({ currentFirmwareVersion })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve current firmware version" })
		return
	}
}
