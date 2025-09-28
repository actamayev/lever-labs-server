import { isUndefined } from "lodash"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ValidationErrorResponse} from "@lever-labs/common-ts/types/api"

export default function validateImageType (req: Request, res: Response, next: NextFunction): void {
	try {
		const imageMimeTypes = ["image/jpeg", "image/png"]

		if (isUndefined(req.file) || !imageMimeTypes.includes(req.file.mimetype)) {
			res.status(400).json({ validationError: "File is not a valid image." } satisfies ValidationErrorResponse)
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate Image Type" } satisfies ErrorResponse)
		return
	}
}
