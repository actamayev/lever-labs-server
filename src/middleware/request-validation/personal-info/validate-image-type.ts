import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@bluedotrobots/common-ts"

export default function validateImageType (req: Request, res: Response, next: NextFunction): void {
	try {
		const imageMimeTypes = ["image/jpeg", "image/png"]

		if (isUndefined(req.file) || !imageMimeTypes.includes(req.file.mimetype)) {
			res.status(400).json({ validationError: "File is not a valid image." } as ValidationErrorResponse)
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate Image Type" } as ErrorResponse)
		return
	}
}
