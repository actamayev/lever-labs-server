import Redis from "ioredis"
import { isNull, isUndefined } from "lodash"
import Singleton from "../singletons/singleton"
import SecretsManager from "./secrets-manager"

export default class RedisManager extends Singleton {
	private client: Redis

	private constructor(client: Redis) {
		super()
		this.client = client
	}

	public static override async getInstance(): Promise<RedisManager> {
		if (isNull(RedisManager.instance)) {
			const client = await RedisManager.createClient()
			RedisManager.instance = new RedisManager(client)
		}
		return RedisManager.instance as RedisManager
	}

	private static async createClient(): Promise<Redis> {
		let host: string
		let port: number
		let password: string | undefined

		// Determine environment and get connection details
		if (isUndefined(process.env.NODE_ENV)) {
			// Local environment
			host = process.env.REDIS_HOST || "localhost"
			port = parseInt(process.env.REDIS_PORT || "6379", 10)
			password = process.env.REDIS_PASSWORD
		} else {
			// Staging or Production - get from SecretsManager
			const secrets = await SecretsManager.getInstance().getSecrets(["REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD"])
			host = secrets.REDIS_HOST
			port = parseInt(secrets.REDIS_PORT, 10)
			password = secrets.REDIS_PASSWORD
		}

		// Create Redis client
		const client = new Redis({
			host,
			port,
			password,
			// Enable TLS for staging/production (AWS ElastiCache requirement)
			tls: isUndefined(process.env.NODE_ENV) ? undefined : {},
			// Fail fast - don't retry on connection failure
			retryStrategy: (): number | null => null,
			// Shorter timeouts for fail-fast behavior
			connectTimeout: 10000,
			lazyConnect: true // Don't auto-connect, we'll control it
		})

		// Create connection promise for fail-fast behavior
		const connectionPromise = new Promise<void>((resolve, reject) => {
			client.once("ready", () => {
				console.info("Redis connection established successfully")
				resolve()
			})

			client.once("error", (error) => {
				console.error("Redis connection failed:", error)
				reject(new Error(`Failed to connect to Redis: ${error.message}`))
			})
		})

		// Initiate connection
		client.connect().catch((error) => {
			console.error("Error initiating Redis connection:", error)
		})

		// Wait for connection to be ready (fail-fast)
		await connectionPromise

		return client
	}

	// ==================== Typed Wrapper Methods ====================

	/**
	 * Get the value of a key
	 */
	public async get(key: RedisKey): Promise<string | null> {
		return await this.client.get(key)
	}

	/**
	 * Set key to hold the string value
	 */
	public async set(key: RedisKey, value: string): Promise<"OK" | null> {
		return await this.client.set(key, value)
	}

	/**
	 * Delete a key
	 */
	public async del(key: RedisKey): Promise<number> {
		return await this.client.del(key)
	}

	/**
	 * Get all keys matching a pattern (use sparingly in production)
	 */
	public async keys(pattern: string): Promise<RedisKey[]> {
		return (await this.client.keys(pattern)) as RedisKey[]
	}
}
