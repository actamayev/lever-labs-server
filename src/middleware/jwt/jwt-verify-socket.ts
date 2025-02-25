import { Socket } from "socket.io"
import isUndefined from "lodash/isUndefined"
import getDecodedId from "../../utils/auth-helpers/get-decoded-id"

export default async function jwtVerifySocket(socket: Socket, next: (err?: Error) => void): Promise<void> {
	try {
		const accessToken = socket.handshake.auth.token as string

		// Handle missing token
		if (!accessToken) {
			return next(new Error("Authentication token required"))
		}

		const userId = await getDecodedId(accessToken)

		if (isUndefined(userId)) {
			return next(new Error("Invalid authentication token"))
		}

		socket.userId = userId
		next()
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		// Handle specific JWT errors with custom messages
		if (error.name === "JsonWebTokenError") {
			return next(new Error("Invalid token format"))
		}
		if (error.name === "TokenExpiredError") {
			return next(new Error("Token has expired"))
		}

		// Handle any other unexpected errors
		console.error("Socket authentication error:", error)
		return next(new Error("Authentication failed"))
	}
}
