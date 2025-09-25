import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts/types/api"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default function setSerialConnectionStatus(req: Request, res: Response): void {
	try {
		const { userId } = req
		const { pipUUID, connected } = req.body as { pipUUID: PipUUID; connected: boolean }

		if (!connected) {
			Esp32SocketManager.getInstance().handleSerialDisconnect(pipUUID)
		} else {
			const onlineConnectedUserId = Esp32SocketManager.getInstance().handleSerialConnect(pipUUID, userId)
			if (onlineConnectedUserId && onlineConnectedUserId !== userId) {
				BrowserSocketManager.getInstance().emitPipStatusUpdateToUser(
					onlineConnectedUserId, pipUUID, "offline"
				)
				BrowserSocketManager.getInstance().removePipConnection(onlineConnectedUserId)
			}
		}

		const action = connected ? "connected to" : "disconnected from"
		res.status(200).json({ success: `Successfully ${action} serial` } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to set serial connection status" } satisfies ErrorResponse)
		return
	}
}
