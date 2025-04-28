import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import Encryptor from "../../../classes/encryptor"
import { ErrorResponse , ValidationErrorResponse} from "@bluedotrobots/common-ts"
const subscribeForEmailUpdatesSchema = Joi.object({
	email: Joi.string().required()
}).required()

export default function validateDecodeEmailSubscriber(req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = subscribeForEmailUpdatesSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } as ValidationErrorResponse)
			return
		}

		if (!Encryptor.isDeterministicEncryptedString(req.body.email)) {
			res.status(400).json({ validationError: "Email is not encrypted" } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate encrypted email" } as ErrorResponse)
		return
	}
}
