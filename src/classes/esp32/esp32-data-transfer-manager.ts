import Singleton from "../singleton"
import SingleESP32Connection from "./single-esp32-connection"

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
	): Promise<void> {
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
}
