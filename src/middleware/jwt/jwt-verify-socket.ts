import { Socket } from "socket.io"
import isUndefined from "lodash/isUndefined"
import getDecodedId from "../../utils/auth-helpers/get-decoded-id"
import { AUTH_COOKIE_NAME } from "../cookie-helpers"

export default async function jwtVerifySocket(socket: Socket, next: (err?: Error) => void): Promise<void> {
	try {
		let accessToken: string | undefined

		// Only get token from cookies (no fallback to auth.token)
		if (socket.handshake.headers.cookie) {
			const cookies = parseCookies(socket.handshake.headers.cookie)
			accessToken = cookies[AUTH_COOKIE_NAME]
		}

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

// Helper function to parse cookies from cookie header string
function parseCookies(cookieHeader: string): Record<string, string> {
	const cookies: Record<string, string> = {}

	cookieHeader.split(";").forEach(cookie => {
		const [name, ...rest] = cookie.split("=")
		const value = rest.join("=").trim()
		if (name && value) {
			cookies[name.trim()] = decodeURIComponent(value)
		}
	})

	return cookies
}
