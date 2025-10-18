import { isNull } from "lodash"
import Singleton from "./singletons/singleton"

interface StreamData {
	abortController: AbortController
	createdAt: number
}

export default class StreamManager extends Singleton {
	private streams: Map<string, StreamData> = new Map()

	private constructor() {
		super()
	}

	public static override getInstance(): StreamManager {
		if (!StreamManager.instance) {
			StreamManager.instance = new StreamManager()
		}
		return StreamManager.instance
	}

	// Start a new stream and return streamId
	public createStream(): { streamId: string; abortController: AbortController } {
		const streamId = `stream_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
		const abortController = new AbortController()

		this.streams.set(streamId, {
			abortController,
			createdAt: Date.now()
		})

		// Auto-cleanup after 30 seconds
		setTimeout(() => {
			this.cleanupStream(streamId)
		}, 30 * 1000)

		return { streamId, abortController }
	}

	// Stop a stream
	public stopStream(streamId: string): boolean {
		const streamData = this.streams.get(streamId)

		if (isNull(streamData) || !streamData) return false

		this.cleanupStream(streamId)
		return true
	}

	// Clean up a stream
	private cleanupStream(streamId: string): void {
		const streamData = this.streams.get(streamId)
		if (streamData) {
			// Abort the stream if it's still running
			streamData.abortController.abort()
			this.streams.delete(streamId)
		}
	}

	// Optional: Get active stream count (useful for monitoring)
	public getActiveStreamCount(): number {
		return this.streams.size
	}
}
