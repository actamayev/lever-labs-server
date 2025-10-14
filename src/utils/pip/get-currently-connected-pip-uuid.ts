import { isNull, isUndefined } from "lodash"
import { PipUUID } from "@lever-labs/common-ts/types/utils"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default function getCurrentlyConnectedPipUUID(userId: number): PipUUID | null {
	try {
		const pipUUID = BrowserSocketManager.getInstance().getCurrentlyConnectedPipUUID(userId)
		if (isNull(pipUUID)) return null

		const foundPip = Esp32SocketManager.getInstance().getESPStatus(pipUUID)
		if (
			isUndefined(foundPip) ||
			foundPip.connectedToOnlineUserId !== userId
		) return null

		return pipUUID
	} catch (error) {
		console.error(error)
		return null
	}
}
