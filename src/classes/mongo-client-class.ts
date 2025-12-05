import mongoose from "mongoose"
import isUndefined from "lodash/isUndefined"
import SecretsManager from "./aws/secrets-manager"

export default class MongoClientClass {
	private constructor() {}

	public static async connect(): Promise<void> {
		try {
			// If already connected, return
			if (this.isConnected()) return

			// Get MongoDB URL
			let mongoUrl: string
			if (isUndefined(process.env.NODE_ENV)) {
				// Local environment
				mongoUrl = process.env.MONGODB_URL
			} else {
				// Production - get from SecretsManager
				mongoUrl = await SecretsManager.getInstance().getSecret("MONGODB_URL")
			}

			// Connect to MongoDB
			await mongoose.connect(mongoUrl, {
				// Connection pool settings
				maxPoolSize: 10,
				minPoolSize: 2,

				// Timeout settings
				serverSelectionTimeoutMS: 5000,
				socketTimeoutMS: 45000,

				// Auto-reconnect is enabled by default in Mongoose 6+
				// These settings help with reconnection behavior
				heartbeatFrequencyMS: 10000, // Check connection health every 10s
			})

			console.info("✅ MongoDB connected successfully")

			// Connection event handlers
			mongoose.connection.on("connected", () => {
				console.info("🔗 MongoDB connection established")
			})

			mongoose.connection.on("disconnected", () => {
				console.warn("⚠️ MongoDB disconnected - driver will auto-reconnect")
			})

			mongoose.connection.on("reconnected", () => {
				console.info("🔄 MongoDB reconnected successfully")
			})

			mongoose.connection.on("error", (error) => {
				console.error("❌ MongoDB connection error:", error)
			})

		} catch (error) {
			console.error("❌ Failed to connect to MongoDB:", error)
			throw error
		}
	}

	public static isConnected(): boolean {
		// Use mongoose's actual connection state instead of a flag
		// 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
		return mongoose.connection.readyState === 1
	}
}
