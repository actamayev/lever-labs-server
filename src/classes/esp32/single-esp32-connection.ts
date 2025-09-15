import { UUID } from "crypto"

export default class SingleESP32Connection {
	private _isAlive: boolean = true
	private pingInterval?: NodeJS.Timeout
	private readonly PING_INTERVAL = 1500
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
			if (!this._isAlive) {
				console.info(`Ping timeout for socket ${this.socketId}`)
				this.cleanup("ping_timeout")
				return
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

	public dispose(): void {
		this.cleanup("disposed")
	}
}
