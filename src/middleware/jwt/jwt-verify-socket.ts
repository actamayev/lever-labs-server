import { Socket } from "socket.io"
import isUndefined from "lodash/isUndefined"
import getDecodedId from "../../utils/auth-helpers/get-decoded-id"

export default async function jwtVerifySocket (socket: Socket, next: (err?: Error) => void): Promise<void> {
	const accessToken = socket.handshake.auth.token as string

	const userId = await getDecodedId(accessToken)
	if (isUndefined(userId)) {
		return next(new Error("Authentication error"))
	}

	socket.userId = userId
	next()
}
