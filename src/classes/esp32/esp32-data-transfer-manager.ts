import Singleton from "../singleton"
import ESP32PingManager from "./esp32-ping-manager"

export default class ESP32DataTransferManager extends Singleton {
	private readonly chunkSize = 72 * 1024 // 72KB
	private readonly pingManager: ESP32PingManager

	private constructor() {
		super()
		this.pingManager = ESP32PingManager.getInstance()
	}

	public static getInstance(): ESP32DataTransferManager {
		if (!ESP32DataTransferManager.instance) {
			ESP32DataTransferManager.instance = new ESP32DataTransferManager()
		}
		return ESP32DataTransferManager.instance
	}

	private createChunkMessage(
		chunkIndex: number,
		totalChunks: number,
		totalSize: number,
		data: string
	): object {
		return {
			event: "new-user-code",
			chunkIndex,
			totalChunks,
			totalSize,
			isLast: chunkIndex === totalChunks - 1,
			data
		}
	}

	private async sendChunk(
		socket: ExtendedWebSocket,
		message: object
	): Promise<boolean> {
		return await new Promise((resolve) => {
			socket.send(JSON.stringify(message), (error) => {
				if (error) {
					console.error("Failed to send chunk:", error)
					resolve(false)
				}
				resolve(true)
			})
		})
	}

	private async sendAllChunks(
		socket: ExtendedWebSocket,
		base64Data: string,
		totalSize: number,
		chunks: number
	): Promise<boolean> {
		for (let currentChunk = 0; currentChunk < chunks; currentChunk++) {
			const start = currentChunk * this.chunkSize
			const end = Math.min(start + this.chunkSize, base64Data.length)
			const chunk = base64Data.slice(start, end)

			const message = this.createChunkMessage(
				currentChunk,
				chunks,
				totalSize,
				chunk
			)

			const success = await this.sendChunk(socket, message)
			if (!success) {
				return false
			}

			// Add delay between chunks
			await new Promise(resolve => setTimeout(resolve, 200))
		}

		return true
	}

	private setupStatusHandler(
		socket: ExtendedWebSocket,
		socketId: string,
		onTimeout: (socketId: string, ws: ExtendedWebSocket, interval: NodeJS.Timeout) => void
	): (data: string) => void {
		return (data: string) => {
			try {
				const message = JSON.parse(data)
				if (message.event === "update_status" && message.status === "error") {
					console.error(`ESP reported error: ${message.error}`)
					this.pingManager.setupPingInterval(socketId, socket, onTimeout)
					return false
				}
			} catch (e) {
				console.error(e)
				throw e
			}
			return true
		}
	}

	public async transferBinaryData(
		socket: ExtendedWebSocket,
		socketId: string,
		binary: Buffer,
		onTimeout: (socketId: string, ws: ExtendedWebSocket, interval: NodeJS.Timeout) => void
	): Promise<boolean> {
		try {
			// Pause ping-pong checks during transfer
			this.pingManager.clearPingInterval(socketId)

			// Setup status handler
			const statusHandler = this.setupStatusHandler(socket, socketId, onTimeout)
			socket.on("message", statusHandler)

			// Prepare data
			const base64Data = binary.toString("base64")
			const chunks = Math.ceil(base64Data.length / this.chunkSize)

			console.info(`Starting transfer of ${binary.length} bytes in ${chunks} chunks`)

			// Send all chunks
			const success = await this.sendAllChunks(
				socket,
				base64Data,
				binary.length,
				chunks
			)

			// Resume ping-pong checks
			this.pingManager.setupPingInterval(socketId, socket, onTimeout)

			if (success) {
				console.info(`Successfully sent all ${chunks} chunks`)
				return true
			} else {
				console.error("Transfer stopped due to error")
				return false
			}

		} catch (error) {
			console.error("Failed to send binary data:", error)
			throw error
		}
	}
}
