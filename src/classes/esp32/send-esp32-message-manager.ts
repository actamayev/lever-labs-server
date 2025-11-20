import { isUndefined } from "lodash"
import Singleton from "../singleton"
import Esp32SocketManager from "./esp32-socket-manager"
import EspLatestFirmwareManager from "./esp-latest-firmware-manager"
import { DeviceInitialDataPayload } from "@lever-labs/common-ts/types/pip"
import { MessageBuilder } from "@lever-labs/common-ts/message-builder"
import { PipUUID } from "@lever-labs/common-ts/types/utils"
import { LedControlData } from "@lever-labs/common-ts/types/garage"
import { ToneType } from "@lever-labs/common-ts/protocol"
import BrowserSocketManager from "../browser-socket-manager"

export default class SendEsp32MessageManager extends Singleton {
	private constructor() {
		super()
	}

	public static override getInstance(): SendEsp32MessageManager {
		if (!SendEsp32MessageManager.instance) {
			SendEsp32MessageManager.instance = new SendEsp32MessageManager()
		}
		return SendEsp32MessageManager.instance
	}

	private getPipConnectionSocket(pipUUID: PipUUID): ExtendedWebSocket {
		try {
			const connection = Esp32SocketManager.getInstance().getCommandConnection(pipUUID) // CHANGED
			if (!connection) {
				throw new Error(`No active command connection for Pip ${pipUUID}`)
			}

			return connection.socket
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	public transferUpdateAvailableMessage(
		pipUUID: PipUUID,
		deviceInitialDataPayload: DeviceInitialDataPayload
	): Promise<void> {
		try {
			if (isUndefined(process.env.NODE_ENV)) return Promise.resolve()
			const latestFirmwareVersion = EspLatestFirmwareManager.getInstance().latestFirmwareVersion
			if (deviceInitialDataPayload.firmwareVersion >= latestFirmwareVersion) return Promise.resolve()

			const buffer = MessageBuilder.createUpdateAvailableMessage(latestFirmwareVersion)

			return this.sendBinaryMessage(pipUUID, buffer)
		} catch (error: unknown) {
			console.error("Transfer failed:", error)
			throw new Error(`Transfer failed: ${error || "Unknown reason"}`)
		}
	}

	public transferLedControlDataToAll(data: Omit<LedControlData, "pipUUID">): Promise<void[]> {
		try {
			const buffer = MessageBuilder.createLedMessage(data as LedControlData)
			const connectedPipUUIDs = Esp32SocketManager.getInstance().getAllConnectedPipUUIDs()
			const promises: Promise<void>[] = []

			// Send to all connected ESP32 devices
			for (const pipUUID of connectedPipUUIDs) {
				promises.push(this.sendBinaryMessage(pipUUID, buffer))
			}

			return Promise.all(promises)
		} catch (error: unknown) {
			console.error("Transfer to all failed:", error)
			throw new Error(`Transfer to all failed: ${error || "Unknown reason"}`)
		}
	}

	public playToneToAll(): Promise<void[]> {
		const toneToPlay = ToneType.A
		try {
			const buffer = MessageBuilder.createToneCommandMessage(toneToPlay)
			const connectedPipUUIDs = Esp32SocketManager.getInstance().getAllConnectedPipUUIDs()
			const promises: Promise<void>[] = []

			for (const pipUUID of connectedPipUUIDs) {
				promises.push(this.sendBinaryMessage(pipUUID, buffer))
			}

			return Promise.all(promises)
		} catch (error: unknown) {
			console.error("Tone transfer to all failed:", error)
			throw new Error(`Tone transfer to all failed: ${error || "Unknown reason"}`)
		}
	}

	public sendBinaryMessage(pipUUID: PipUUID, buffer: ArrayBuffer): Promise<void> {
		try {
			const socket = this.getPipConnectionSocket(pipUUID)

			return new Promise((resolve, reject) => {
				socket.send(buffer, { binary: true }, (error) => {
					if (error) {
						reject(new Error(`Failed to send data: ${error.message}`))
					} else {
						const status = Esp32SocketManager.getInstance().getESPStatus(pipUUID)
						if (status?.connectedToOnlineUserId) {
							Esp32SocketManager.getInstance().updateLastActivityForUser(pipUUID, status.connectedToOnlineUserId)
							// Also update browser socket manager activity for proper 90min timer
							BrowserSocketManager.getInstance().updateUserActivity(status.connectedToOnlineUserId)
						}
						resolve()
					}
				})
			})
		} catch (error: unknown) {
			console.error(`Failed to send binary message to Pip ${pipUUID}:`, error)
			throw error
		}
	}
}
