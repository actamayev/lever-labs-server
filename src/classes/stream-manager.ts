import Singleton from "./singleton"

export default class StreamManager extends Singleton {
	private activeStreams = new Map<string, AbortController>()

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
			return true
		}

		return false
	}

	// Clean up a stream
	private cleanupStream(streamId: string): void {
		this.activeStreams.delete(streamId)
	}
}
