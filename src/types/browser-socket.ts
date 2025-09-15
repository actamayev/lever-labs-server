import { PipUUID } from "@bluedotrobots/common-ts/types/utils"

declare global {
	interface CurrentlyConnectedPip {
		pipUUID: PipUUID
		status: ESPConnectionState
	}

	type BrowserSocketConnectionInfo = {
		socketId: string
		currentlyConnectedPip: CurrentlyConnectedPip | null
	}
}

export {}
