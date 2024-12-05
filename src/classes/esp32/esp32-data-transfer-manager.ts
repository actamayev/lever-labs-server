import Singleton from "../singleton"
import SingleESP32Connection from "./single-esp32-connection"

interface TransferMetadata {
    event: "new-user-code-meta"
    chunkIndex: number
    totalChunks: number
    totalSize: number
    isLast: boolean
    chunkSize: number
}

export default class ESP32DataTransferManager extends Singleton {
	private readonly chunkSize = 128 * 1024 // 128KB
	private readonly defaultChunkDelay = 300 // ms

	private constructor() {
		super()
	}

	public static getInstance(): ESP32DataTransferManager {
		if (!ESP32DataTransferManager.instance) {
			ESP32DataTransferManager.instance = new ESP32DataTransferManager()
		}
		return ESP32DataTransferManager.instance
	}

	public async transferBinaryData(
		connection: SingleESP32Connection,
		binary: Buffer,
		// options: TransferOptions = {}
	): Promise<void> {
		// Pause ping-pong checks during transfer
		// TODO: Make sure this is paused
		// this.pingManager.clearPingInterval(socketId)

		// Setup status handler

		// Prepare data
		const chunks = Math.ceil(binary.length / this.chunkSize)
		console.info(`Starting transfer of ${binary.length} bytes in ${chunks} chunks`)

		const statusHandler = this.createStatusHandler()
		connection.socket.on("message", statusHandler)
		try {
			// Send all chunks
			await this.sendAllChunks(connection, binary, chunks)
			console.info(`Successfully transferred all ${chunks} chunks`)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			console.error("Transfer failed:", error)
			throw new Error(`Transfer failed: ${error?.message || "Unknown reason"}`)
		} finally {
			connection.socket.off("message", statusHandler)
		}
	}

	private createStatusHandler(): (data: string) => void {
		return (data: string) => {
			try {
				const message = JSON.parse(data)
				if (message.event === "update_status" && message.status === "error") {
					console.error(`ESP reported error during transfer: ${message.error}`)
					throw new Error(`ESP error: ${message.error}`)
				}
			} catch (e) {
				if (e instanceof SyntaxError) {
					// Ignore non-JSON messages
					return
				}
				throw e
			}
		}
	}

	private async sendAllChunks(
		connection: SingleESP32Connection,
		binary: Buffer,
		totalChunks: number,
	): Promise<void> {
		for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
			const start = chunkIndex * this.chunkSize
			const end = Math.min(start + this.chunkSize, binary.length)
			const chunk = Buffer.from(binary.subarray(start, end))

			if (chunk.length === 0) {
				throw new Error(`Empty chunk detected at index ${chunkIndex}`)
			}

			console.debug(`Sending chunk ${chunkIndex}/${totalChunks}:`, {
				start,
				end,
				size: chunk.length,
				isLast: chunkIndex === totalChunks - 1
			})

			await this.sendChunk(
				connection,
				chunk,
				chunkIndex,
				totalChunks,
				binary.length
			)

			if (chunkIndex < totalChunks - 1) {
				await new Promise(resolve => setTimeout(resolve, this.defaultChunkDelay))
			}
		}
	}

	private async sendChunk(
		connection: SingleESP32Connection,
		chunk: Buffer,
		chunkIndex: number,
		totalChunks: number,
		totalSize: number
	): Promise<void> {
		const metadata: TransferMetadata = {
			event: "new-user-code-meta",
			chunkIndex,
			totalChunks,
			totalSize,
			isLast: chunkIndex === totalChunks - 1,
			chunkSize: chunk.length
		}

		// Send metadata first
		await this.sendSocketData(connection.socket, JSON.stringify(metadata))

		// Small delay between metadata and binary
		await new Promise(resolve => setTimeout(resolve, 50))

		// Send binary chunk
		await this.sendSocketData(connection.socket, chunk, { binary: true })
	}

	private sendSocketData(
		socket: ExtendedWebSocket,
		data: string | Buffer,
		options: { binary?: boolean } = {}
	): Promise<void> {
		return new Promise((resolve, reject) => {
			socket.send(data, options, (error) => {
				if (error) {
					reject(new Error(`Failed to send data: ${error.message}`))
				} else {
					resolve()
				}
			})
		})
	}


	// private async sendChunkWithMetadata(
	// 	socket: ExtendedWebSocket,
	// 	chunkIndex: number,
	// 	totalChunks: number,
	// 	totalSize: number,
	// 	isLast: boolean,
	// 	binaryData: Buffer
	// ): Promise<boolean> {
	// 	// First send metadata
	// 	const metadata = {
	// 		event: "new-user-code-meta",
	// 		chunkIndex,
	// 		totalChunks,
	// 		totalSize,
	// 		isLast,
	// 		chunkSize: binaryData.length  // Add this for debugging
	// 	}

	// 	console.log("Sending chunk metadata:", metadata)

	// 	try {
	// 		// Send metadata
	// 		await new Promise<void>((resolve, reject) => {
	// 			socket.send(JSON.stringify(metadata), (error) => {
	// 				if (error) reject(error)
	// 				else resolve()
	// 			})
	// 		})

	// 		// Wait a bit between metadata and binary
	// 		await new Promise(resolve => setTimeout(resolve, 50))

	// 		// Send binary data
	// 		console.log(`Sending binary data of size: ${binaryData.length} bytes`)

	// 		await new Promise<void>((resolve, reject) => {
	// 			// Send as Buffer directly
	// 			socket.send(binaryData, { binary: true }, (error) => {
	// 				if (error) {
	// 					console.error(`Failed to send binary chunk ${chunkIndex}:`, error)
	// 					reject(error)
	// 				} else {
	// 					console.log(`Successfully sent binary chunk ${chunkIndex}`)
	// 					resolve()
	// 				}
	// 			})
	// 		})

	// 		return true
	// 	} catch (error) {
	// 		console.error(`Error in sendChunkWithMetadata for chunk ${chunkIndex}:`, error)
	// 		return false
	// 	}
	// }

	// // eslint-disable-next-line max-lines-per-function
	// private async sendAllChunks(
	// 	socket: ExtendedWebSocket,
	// 	binary: Buffer,
	// 	chunks: number
	// ): Promise<boolean> {
	// 	try {
	// 		console.log(`Total binary size: ${binary.length} bytes`)

	// 		for (let currentChunk = 0; currentChunk < chunks; currentChunk++) {
	// 			const start = currentChunk * this.chunkSize
	// 			const end = Math.min(start + this.chunkSize, binary.length)
	// 			const chunk = Buffer.from(binary.subarray(start, end))

	// 			console.log(`Chunk ${currentChunk}:`, {
	// 				start,
	// 				end,
	// 				expectedSize: end - start,
	// 				actualSize: chunk.length,
	// 				isLastChunk: currentChunk === chunks - 1
	// 			})

	// 			// Verify chunk content
	// 			if (chunk.length === 0) {
	// 				console.error(`Empty chunk detected at index ${currentChunk}`)
	// 				return false
	// 			}

	// 			const success = await this.sendChunkWithMetadata(
	// 				socket,
	// 				currentChunk,
	// 				chunks,
	// 				binary.length,
	// 				currentChunk === chunks - 1,
	// 				chunk
	// 			)

	// 			if (!success) {
	// 				console.error(`Failed to send chunk ${currentChunk}`)
	// 				return false
	// 			}

	// 			await new Promise(resolve => setTimeout(resolve, 300))
	// 		}

	// 		return true
	// 	} catch (error) {
	// 		console.error("Error in sendAllChunks:", error)
	// 		throw error
	// 	}
	// }

	// private setupStatusHandler(
	// 	socket: ExtendedWebSocket,
	// 	socketId: string,
	// 	onTimeout: (socketId: string, ws: ExtendedWebSocket, interval: NodeJS.Timeout) => void
	// ): (data: string) => void {
	// 	return (data: string) => {
	// 		try {
	// 			const message = JSON.parse(data)
	// 			if (message.event === "update_status" && message.status === "error") {
	// 				console.error(`ESP reported error: ${message.error}`)
	// 				this.pingManager.setupPingInterval(socketId, socket, onTimeout)
	// 				return false
	// 			}
	// 		} catch (e) {
	// 			console.error(e)
	// 			throw e
	// 		}
	// 		return true
	// 	}
	// }
}
