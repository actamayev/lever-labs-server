import { isUndefined } from "lodash"
import Singleton from "../singleton"
import Esp32SocketManager from "./esp32-socket-manager"
import EspLatestFirmwareManager from "./esp-latest-firmware-manager"
import { PipUUIDPayload } from "@bluedotrobots/common-ts/types/pip"
import { MessageBuilder } from "@bluedotrobots/common-ts/message-builder"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import { LedControlData } from "@bluedotrobots/common-ts/types/garage"
import { tuneToSoundType } from "@bluedotrobots/common-ts/protocol"

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
			const connection = Esp32SocketManager.getInstance().getConnection(pipUUID)
			if (!connection) {
				throw new Error(`No active connection for Pip ${pipUUID}`)
			}

			return connection.socket
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	public transferUpdateAvailableMessage(pipUUIDPayload: PipUUIDPayload): Promise<void> {
		try {
			if (isUndefined(process.env.NODE_ENV)) return Promise.resolve()
			const latestFirmwareVersion = EspLatestFirmwareManager.getInstance().latestFirmwareVersion
			if (pipUUIDPayload.firmwareVersion >= latestFirmwareVersion) return Promise.resolve()

			const buffer = MessageBuilder.createUpdateAvailableMessage(latestFirmwareVersion)

			return this.sendBinaryMessage(pipUUIDPayload.pipUUID, buffer)
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

	public playSoundToAll(): Promise<void[]> {
		const tuneToPlay = "Chime"
		try {
			const buffer = MessageBuilder.createSoundMessage(tuneToSoundType[tuneToPlay])
			const connectedPipUUIDs = Esp32SocketManager.getInstance().getAllConnectedPipUUIDs()
			const promises: Promise<void>[] = []

			for (const pipUUID of connectedPipUUIDs) {
				promises.push(this.sendBinaryMessage(pipUUID, buffer))
			}

			return Promise.all(promises)
		} catch (error: unknown) {
			console.error("Sound transfer to all failed:", error)
			throw new Error(`Sound transfer to all failed: ${error || "Unknown reason"}`)
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
