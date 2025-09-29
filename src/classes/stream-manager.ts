import SingletonWithRedis from "./singletons/singleton-with-redis"

export default class StreamManager extends SingletonWithRedis {

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
	public async createStream(): Promise<{ streamId: string; abortController: AbortController }> {
		const streamId = `stream_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
		const abortController = new AbortController()

		const redis = await this.getRedis()
		await redis.set(`stream:${streamId}`, "active")

		// Auto-cleanup after exit
		setTimeout(() => {
			void this.cleanupStream(streamId)
		}, 30 * 1000)

		return { streamId, abortController }
	}

	// Stop a stream
	public async stopStream(streamId: string): Promise<boolean> {
		const redis = await this.getRedis()
		const streamExists = await redis.get(`stream:${streamId}`)

		if (streamExists) {
			await this.cleanupStream(streamId)
			return true
		}

		return false
	}

	// Clean up a stream
	private async cleanupStream(streamId: string): Promise<void> {
		const redis = await this.getRedis()
		await redis.del(`stream:${streamId}`)
	}
}
