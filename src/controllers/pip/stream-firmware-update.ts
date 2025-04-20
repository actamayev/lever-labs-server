import { Response, Request } from "express"
import EspLatestFirmwareManager from "../../classes/esp32/esp-latest-firmware-manager"

export default async function streamFirmwareUpdate(_req: Request, res: Response): Promise<void> {
	try {
		const binaryData = await EspLatestFirmwareManager.getInstance().getLatestFirmwareInfo()

		res.send(binaryData)
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error" })
	}
}
