import _ from "lodash"
import { Request, Response, NextFunction } from "express"

export default function validateImageType (req: Request, res: Response, next: NextFunction): void {
	try {
		const imageMimeTypes = ["image/jpeg", "image/png"]

		if (_.isUndefined(req.file) || !imageMimeTypes.includes(req.file.mimetype)) {
			res.status(400).json({ validationError: "File is not a valid image." })
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate Image Type" })
		return
	}
}
