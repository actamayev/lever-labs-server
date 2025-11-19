import { PipUUID } from "@lever-labs/common-ts/types/utils"

export default class SingleESP32Connection {
	private _isAlive: boolean = true
	private _lastHeartbeat: number = Date.now() // NEW
	private pingInterval?: NodeJS.Timeout
	private _missedPingCount: number = 0
	private readonly MAX_MISSED_PINGS = 2
	private readonly PING_INTERVAL = 750
	private readonly HEARTBEAT_TIMEOUT = 3000 // NEW: 3 seconds without heartbeat
	private isCleaningUp = false

	constructor(
		private readonly pipId: PipUUID,
		public readonly socket: ExtendedWebSocket,
		private readonly onDisconnect: (pipId: PipUUID) => void
	) {
		if (socket.pipId !== pipId) {
			console.warn(`PipId mismatch: constructor=${pipId}, socket=${socket.pipId}`)
		}
		this.initializeSocket()
	}

	private initializeSocket(): void {
		this.socket.on("pong", () => this.handlePong())
		this.socket.on("close", () => this.cleanup("socket_closed"))
		this.socket.on("error", (error) => {
			console.error(`Socket error for ${this.pipId}:`, error)
			this.cleanup("socket_error")
		})

		this.startPingInterval()
	}

	private startPingInterval(): void {
		this.pingInterval = setInterval(() => {
			// Check heartbeat timeout
			const timeSinceHeartbeat = Date.now() - this._lastHeartbeat
			if (timeSinceHeartbeat > this.HEARTBEAT_TIMEOUT) {
				console.info(`Heartbeat timeout for ${this.pipId} (${timeSinceHeartbeat}ms since last heartbeat)`)
				this.cleanup("heartbeat_timeout")
				return
			}

			// Check ping timeout
			if (this._missedPingCount >= this.MAX_MISSED_PINGS) {
				console.info(`${this.MAX_MISSED_PINGS} consecutive pings missed for ${this.pipId}`)
				this.cleanup("ping_timeout")
				return
			}

			if (!this._isAlive) {
				this._missedPingCount++
				console.info(`Missed ping ${this._missedPingCount}/${this.MAX_MISSED_PINGS} for ${this.pipId}`)
			} else {
				this._missedPingCount = 0
			}

			this._isAlive = false
			this.socket.ping((err: unknown) => {
				if (err) {
					console.error(`Failed to send ping to ${this.pipId}:`, err)
					this.cleanup("ping_failed")
				}
			})
		}, this.PING_INTERVAL)
	}

	private handlePong(): void {
		this._isAlive = true
		this._missedPingCount = 0
	}

	// NEW: Called when heartbeat message received
	public updateHeartbeat(): void {
		this._lastHeartbeat = Date.now()
		this._isAlive = true
		this._missedPingCount = 0
	}

	private cleanup(reason: DisconnectReason, skipCallback: boolean = false): void {
		if (this.isCleaningUp) return
		this.isCleaningUp = true

		console.info(`Cleaning up connection ${this.pipId}, reason: ${reason}`)

		if (this.pingInterval) {
			clearInterval(this.pingInterval)
			this.pingInterval = undefined
		}

		if (this.socket.readyState !== this.socket.CLOSED) {
			this.socket.terminate()
		}

		if (!skipCallback) {
			this.onDisconnect(this.pipId)
		}
	}

	public resetPingCounter(): void {
		this._missedPingCount = 0
		this._isAlive = true
		this._lastHeartbeat = Date.now() // NEW: Also reset heartbeat
	}

	public dispose(skipCallback: boolean = false): void {
		if (skipCallback) {
			this.cleanup("disposed", true)
		} else {
			this.cleanup("disposed")
		}
	}
}
