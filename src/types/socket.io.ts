import { Socket as SocketIOSocket } from "socket.io"

declare module "socket.io" {
	interface Socket extends Partial<Pick<SocketIOSocket, never>> {
		userId: number
	}
}
