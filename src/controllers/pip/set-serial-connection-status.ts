import { Response, Request } from "express"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import { ErrorResponse, MessageResponse, SuccessResponse } from "@bluedotrobots/common-ts/types/api"
import autoConnectToLastOnlineUser from "../../utils/pip/auto-connect-to-last-online-user"

export default function setSerialConnectionStatus(req: Request, res: Response): void {
	try {
		const { userId } = req
		const { pipUUID, connected } = req.body as { pipUUID: PipUUID; connected: boolean }

		let success: boolean
		if (connected) {
			success = Esp32SocketManager.getInstance().setSerialConnection(pipUUID, userId)
		} else {
			Esp32SocketManager.getInstance().handleSerialDisconnect(pipUUID)
			// We don't pass the userId since the user that disconnected serial from pip may be same user as the online user
			autoConnectToLastOnlineUser(pipUUID)
			success = true
		}

		if (!success) {
			const action = connected ? "connect to" : "disconnect from"
			res.status(400).json({
				message: `Unable to ${action} serial. Check if PIP is available and not connected to a user.`
			} satisfies MessageResponse)
			return
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
