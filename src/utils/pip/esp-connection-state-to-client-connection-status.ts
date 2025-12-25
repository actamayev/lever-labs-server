import isNull from "lodash/isNull"
import isUndefined from "lodash/isUndefined"
import { ClientPipConnectionStatus } from "@actamayev/lever-labs-common-ts/types/pip"

export default function espConnectionStateToClientConnectionStatus(
	espConnectionState: ESPConnectionState | undefined,
	userId: number
): ClientPipConnectionStatus {
	if (isUndefined(espConnectionState)) return "offline"
	if (espConnectionState.connectedToSerialUserId === userId) {
		return "connected to serial to you"
	} else if (!isNull(espConnectionState.connectedToSerialUserId)) {
		return "connected to serial to another user"
	} else if (espConnectionState.connectedToOnlineUserId === userId) {
		return "connected online to you"
	} else if (!isNull(espConnectionState.connectedToOnlineUserId)) {
		return "connected online to another user"
	} else if (espConnectionState.online) {
		return "online"
	} else {
		return "offline"
	}
}
