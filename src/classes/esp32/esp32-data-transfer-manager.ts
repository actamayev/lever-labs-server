import Singleton from "../singleton"
import ESP32PingManager from "./esp32-ping-manager"

export default class ESP32DataTransferManager extends Singleton {
	private readonly chunkSize = 512 * 1024 // 120KB
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

	// eslint-disable-next-line max-lines-per-function
	private async sendChunkWithMetadata(
		socket: ExtendedWebSocket,
		chunkIndex: number,
		totalChunks: number,
		totalSize: number,
		isLast: boolean,
		binaryData: Buffer
	): Promise<boolean> {
		// First send metadata
		const metadata = {
			event: "new-user-code-meta",
			chunkIndex,
			totalChunks,
			totalSize,
			isLast,
			chunkSize: binaryData.length  // Add this for debugging
		}

		console.log("Sending chunk metadata:", metadata)

		try {
			// Send metadata
			await new Promise<void>((resolve, reject) => {
				socket.send(JSON.stringify(metadata), (error) => {
					if (error) reject(error)
					else resolve()
				})
			})

			// Wait a bit between metadata and binary
			await new Promise(resolve => setTimeout(resolve, 50))

			// Send binary data
			console.log(`Sending binary data of size: ${binaryData.length} bytes`)

			await new Promise<void>((resolve, reject) => {
				// Send as Buffer directly
				socket.send(binaryData, { binary: true }, (error) => {
					if (error) {
						console.error(`Failed to send binary chunk ${chunkIndex}:`, error)
						reject(error)
					} else {
						console.log(`Successfully sent binary chunk ${chunkIndex}`)
						resolve()
					}
				})
			})

			return true
		} catch (error) {
			console.error(`Error in sendChunkWithMetadata for chunk ${chunkIndex}:`, error)
			return false
		}
	}

	// eslint-disable-next-line max-lines-per-function
	private async sendAllChunks(
		socket: ExtendedWebSocket,
		binary: Buffer,
		chunks: number
	): Promise<boolean> {
		try {
			console.log(`Total binary size: ${binary.length} bytes`)

			for (let currentChunk = 0; currentChunk < chunks; currentChunk++) {
				const start = currentChunk * this.chunkSize
				const end = Math.min(start + this.chunkSize, binary.length)
				const chunk = Buffer.from(binary.subarray(start, end))

				console.log(`Chunk ${currentChunk}:`, {
					start,
					end,
					expectedSize: end - start,
					actualSize: chunk.length,
					isLastChunk: currentChunk === chunks - 1
				})

				// Verify chunk content
				if (chunk.length === 0) {
					console.error(`Empty chunk detected at index ${currentChunk}`)
					return false
				}

				const success = await this.sendChunkWithMetadata(
					socket,
					currentChunk,
					chunks,
					binary.length,
					currentChunk === chunks - 1,
					chunk
				)

				if (!success) {
					console.error(`Failed to send chunk ${currentChunk}`)
					return false
				}

				await new Promise(resolve => setTimeout(resolve, 300))
			}

			return true
		} catch (error) {
			console.error("Error in sendAllChunks:", error)
			throw error
		}
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
			const chunks = Math.ceil(binary.length / this.chunkSize)

			console.info(`Starting transfer of ${binary.length} bytes in ${chunks} chunks`)

			// Send all chunks
			const success = await this.sendAllChunks(
				socket,
				binary,
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
