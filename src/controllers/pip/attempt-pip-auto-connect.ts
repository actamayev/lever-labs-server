import { Request, Response } from "express"
import { ErrorResponse, AutoConnectPipResponse } from "@bluedotrobots/common-ts/types/api"
import autoConnectToPip, { AutoConnectToPipResultEnum } from "../../utils/pip/auto-connect-to-pip"

export default function attemptPipAutoConnect(req: Request, res: Response): void {
	try {
		const { userId } = req
		const autoConnectToPipResult = autoConnectToPip(userId)
		if (autoConnectToPipResult.result === AutoConnectToPipResultEnum.ERROR) {
			res.status(400).json({ error: "Unable to auto connect to Pip" } satisfies ErrorResponse)
			return
		}

		res.status(200).json({ autoConnectedPipUUID: autoConnectToPipResult.pipUUID } satisfies AutoConnectPipResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to attempt Pip Auto Connect" } satisfies ErrorResponse)
		return
	}
}
