// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Socket } from "socket.io"

declare module "socket.io" {
	interface Socket {
		userId?: number
	}
}
