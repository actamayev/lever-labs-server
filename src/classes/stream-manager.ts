import Singleton from "./singleton"

export default class StreamManager extends Singleton {
	private activeStreams = new Map<string, AbortController>()

	private constructor() {
		super()
	}

	public static getInstance(): StreamManager {
		if (!StreamManager.instance) {
			StreamManager.instance = new StreamManager()
		}
		return StreamManager.instance
	}

	// Start a new stream and return streamId
	public createStream(): { streamId: string; abortController: AbortController } {
		const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
		const abortController = new AbortController()

		this.activeStreams.set(streamId, abortController)

		// Auto-cleanup after 5 minutes
		setTimeout(() => {
			this.cleanupStream(streamId)
		}, 5 * 60 * 1000)

		return { streamId, abortController }
	}

	// Stop a stream
	public stopStream(streamId: string): boolean {
		const abortController = this.activeStreams.get(streamId)

		if (abortController) {
			abortController.abort()
			this.cleanupStream(streamId)
			console.log(`Stream ${streamId} stopped`)
			return true
		}

		console.warn(`Stream ${streamId} not found`)
		return false
	}

	// Clean up a stream
	private cleanupStream(streamId: string): void {
		this.activeStreams.delete(streamId)
	}

	// Get abort signal for a stream
	public getAbortSignal(streamId: string): AbortSignal | null {
		const abortController = this.activeStreams.get(streamId)
		return abortController ? abortController.signal : null
	}

	// Check if stream is active
	public isStreamActive(streamId: string): boolean {
		return this.activeStreams.has(streamId)
	}

	// Get count of active streams
	public getActiveStreamCount(): number {
		return this.activeStreams.size
	}
}
