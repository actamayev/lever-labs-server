import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import EspLatestFirmwareManager from "../../classes/esp-latest-firmware-manager"

export default async function streamFirmwareUpdate(req: Request, res: Response): Promise<void> {
	try {
		// TODO: Retrieve binary from a PipFirmware class
		// This class should have binary, and the latest firmware version.
		// Will need to add an endpoint
		const binary = await EspLatestFirmwareManager.getInstance().getLatestFirmwareInfo()

		// await Esp32SocketManager.getInstance().emitBinaryCodeToPip(pipUUID, compiledUserCode)

		res.status(200).json({ ...binary })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to stream firmware update to Pip" })
		return
	}
}
