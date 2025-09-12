import { PipConnectionStatus } from "@bluedotrobots/common-ts/types/pip"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"

declare global {
	interface CurrentlyConnectedPip {
		pipUUID: PipUUID
		status: PipConnectionStatus
	}

	type BrowserSocketConnectionInfo = {
		socketId: string
		currentlyConnectedPip: CurrentlyConnectedPip | null
	}
}

export {}
