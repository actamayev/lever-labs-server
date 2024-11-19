import Singleton from "../singleton"

export default class ESP32PingManager extends Singleton {
	private pingIntervals = new Map<string, NodeJS.Timeout>()
	private readonly pingInterval = 10 * 1000 // 10 seconds

	private constructor() {
		super()
	}

	public static getInstance(): ESP32PingManager {
		if (!ESP32PingManager.instance) {
			ESP32PingManager.instance = new ESP32PingManager()
		}
		return ESP32PingManager.instance
	}

	public setupPingInterval(
		socketId: string,
		ws: ExtendedWebSocket,
		onTimeout: (socketId: string, ws: ExtendedWebSocket, interval: NodeJS.Timeout) => void
	): NodeJS.Timeout {
		const interval = setInterval(() => {
			if (!ws.isAlive) {
				console.info(`Terminating inactive connection for socketId: ${socketId}`)
				onTimeout(socketId, ws, interval)
				return
			}
			ws.isAlive = false
			ws.ping(() => {
				// console.debug(`Ping sent to ${socketId}`)
			})
		}, this.pingInterval)

		this.pingIntervals.set(socketId, interval)
		return interval
	}

	public clearPingInterval(socketId: string): void {
		const interval = this.pingIntervals.get(socketId)
		clearInterval(interval)
		if (!interval) return
		this.pingIntervals.delete(socketId)
	}

	public hasPingInterval(socketId: string): boolean {
		return this.pingIntervals.has(socketId)
	}
}
