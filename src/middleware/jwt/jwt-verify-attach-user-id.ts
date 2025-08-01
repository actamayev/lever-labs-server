import { Request, Response, NextFunction } from "express"
import getDecodedId from "../../utils/auth-helpers/get-decoded-id"
import { ErrorResponse } from "@bluedotrobots/common-ts"
import { getAuthTokenFromCookies } from "../cookie-helpers"

export default async function jwtVerifyAttachUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const accessToken = getAuthTokenFromCookies(req)

		if (!accessToken) return handleUnauthorized()

		const userId = await getDecodedId(accessToken)
		req.userId = userId
		next()
	} catch (error) {
		console.error("JWT verification error:", error)
		return handleUnauthorized()
	}

	function handleUnauthorized(): void {
		res.status(401).json({ error: "Unauthorized User" } satisfies ErrorResponse)
		return
	}
}
