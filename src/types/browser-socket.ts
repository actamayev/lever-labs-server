import { PipConnectionStatus, PipUUID } from "@bluedotrobots/common-ts"

declare global {
	interface PreviouslyConnectedPipUUIDs {
		pipUUID: PipUUID
		status: PipConnectionStatus
	}

	type BrowserSocketConnectionInfo = {
		socketId: string
		previouslyConnectedPipUUIDs: PreviouslyConnectedPipUUIDs[]
	}
}

export {}
