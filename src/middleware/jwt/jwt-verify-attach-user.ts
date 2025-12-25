import Joi from "joi"
import isNull from "lodash/isNull"
import isUndefined from "lodash/isUndefined"
import { ErrorResponse } from "@actamayev/lever-labs-common-ts/types/api"
import { Request, Response, NextFunction } from "express"
import { getAuthTokenFromCookies } from "../cookie-helpers"
import getDecodedId from "../../utils/auth-helpers/get-decoded-id"
import { findUserById } from "../../db-operations/read/find/find-user"

// Schema for validating cookies
const cookieSchema = Joi.object({
	auth_token: Joi.string().required()
}).unknown(true)

export default async function jwtVerifyAttachUser(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		// Only get token from cookies (no fallback)
		const accessToken = getAuthTokenFromCookies(req)

		if (!accessToken) return handleUnauthorized()

		// Validate cookie structure
		const cookieValidation = cookieSchema.validate(req.cookies)
		if (!isUndefined(cookieValidation.error)) {
			console.error("Cookie validation failed:", cookieValidation.error.details)
			return handleUnauthorized()
		}

		const userId = await getDecodedId(accessToken)
		const user = await findUserById(userId)

		if (isNull(user)) {
			console.error(`User not found for userId: ${userId}`)
			return handleUnauthorized()
		}

		req.user = user
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
