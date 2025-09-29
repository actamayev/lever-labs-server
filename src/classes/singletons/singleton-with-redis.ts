/* eslint-disable @typescript-eslint/no-explicit-any */
import RedisManager from "../aws/redis-manager"

export default abstract class SingletonWithRedis {
	protected static instance: any | null = null
	protected readonly region: string = "us-east-1"
	private redis: RedisManager | null = null

	protected constructor() {}

	public static getInstance(): any {
		throw new Error("getInstance method must be implemented in the subclass")
	}

	protected async getRedis(): Promise<RedisManager> {
		if (!this.redis) {
			this.redis = await RedisManager.getInstance()
		}
		return this.redis
	}
}
