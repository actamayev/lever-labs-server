import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse , ValidationErrorResponse} from "@bluedotrobots/common-ts"
const updateNameSchema = Joi.object({
	name: Joi.string().max(50).trim().allow("")
}).required()

export default function validateUpdateName(req: Request, res: Response, next: NextFunction): void {
	try {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (req.params.name === undefined) req.params.name = ""

		const { error } = updateNameSchema.validate(req.params)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: "Invalid name" } as ValidationErrorResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate name" } as ErrorResponse)
		return
	}
}
