import { UUID } from "crypto"

export default class SingleESP32Connection {
	private _isAlive: boolean = true
	private pingInterval?: NodeJS.Timeout
	private _missedPingCount: number = 0
	private readonly MAX_MISSED_PINGS = 2  // Allow 2 missed pings
	private readonly PING_INTERVAL = 750
	private isCleaningUp = false

	constructor(
		public readonly socketId: UUID,
		public readonly socket: ExtendedWebSocket,
		private readonly onDisconnect: (socketId: UUID) => void
	) {
		this.initializeSocket()
	}

	private initializeSocket(): void {
		// Set up socket event handlers
		this.socket.on("pong", () => this.handlePong())
		this.socket.on("close", () => this.cleanup("socket_closed"))
		this.socket.on("error", (error) => {
			console.error(`Socket error for ${this.socketId}:`, error)
			this.cleanup("socket_error")
		})

		// Start ping interval
		this.startPingInterval()
	}

	private startPingInterval(): void {
		this.pingInterval = setInterval(() => {
			if (this._missedPingCount >= this.MAX_MISSED_PINGS) {
				console.info(`${this.MAX_MISSED_PINGS} consecutive pings missed for ${this.socketId}`)
				this.cleanup("ping_timeout")
				return
			}

			if (!this._isAlive) {
				this._missedPingCount++
				console.info(`Missed ping ${this._missedPingCount}/${this.MAX_MISSED_PINGS} for ${this.socketId}`)
			} else {
				this._missedPingCount = 0  // Reset on successful pong
			}

			this._isAlive = false
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.socket.ping((err: any) => {
				if (err) {
					console.error(`Failed to send ping to ${this.socketId}:`, err)
					this.cleanup("ping_failed")
				}
			})
		}, this.PING_INTERVAL)
	}

	private handlePong(): void {
		this._isAlive = true
		this._missedPingCount = 0  // Reset counter on pong
	}

	private cleanup(reason: DisconnectReason): void {
		// Prevent multiple cleanups
		if (this.isCleaningUp) return
		this.isCleaningUp = true

		console.info(`Cleaning up connection ${this.socketId}, reason: ${reason}`)

		// Clear ping interval
		if (this.pingInterval) {
			clearInterval(this.pingInterval)
			this.pingInterval = undefined
		}

		// Close socket if it's still open
		if (this.socket.readyState !== this.socket.CLOSED) {
			this.socket.terminate()
		}

		// Notify manager of disconnection
		this.onDisconnect(this.socketId)
	}

	public resetPingCounter(): void {
		this._missedPingCount = 0
		this._isAlive = true
	}

	public dispose(): void {
		this.cleanup("disposed")
	}
}
