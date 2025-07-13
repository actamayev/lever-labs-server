import { isNull } from "lodash"
import { Response, Request } from "express"
import EspLatestFirmwareManager from "../../classes/esp32/esp-latest-firmware-manager"
import { ErrorResponse } from "@bluedotrobots/common-ts"

export default function getLatestFirmwareData(_req: Request, res: Response): void {
	try {
		const currentFirmwareVersion = EspLatestFirmwareManager.getInstance().latestFirmwareVersion
		const isBinaryNull = isNull(EspLatestFirmwareManager.getInstance().latestBinary)

		res.status(200).json({
			currentFirmwareVersion,
			isBinaryNull
		})
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve current firmware version" } satisfies ErrorResponse)
		return
	}
}
