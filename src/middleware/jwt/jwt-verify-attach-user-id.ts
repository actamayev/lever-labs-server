import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import getDecodedId from "../../utils/auth-helpers/get-decoded-id"
import { ErrorResponse } from "@bluedotrobots/common-ts"

const authorizationSchema = Joi.object({
	authorization: Joi.string().required()
}).unknown(true)

export default async function jwtVerifyAttachUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const { error } = authorizationSchema.validate(req.headers)

		if (!isUndefined(error)) return handleUnauthorized()

		const accessToken = req.headers.authorization as string

		const userId = await getDecodedId(accessToken)

		req.userId = userId
		next()
	} catch (error) {
		console.error(error)
		return handleUnauthorized()
	}

	function handleUnauthorized(): void {
		res.status(401).json({ error: "Unauthorized User" } satisfies ErrorResponse)
		return
	}
}
