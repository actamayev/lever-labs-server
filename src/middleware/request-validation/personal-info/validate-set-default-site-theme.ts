import Joi from "joi"
import _ from "lodash"
import { Request, Response, NextFunction } from "express"

const setDefaultSiteThemeSchema = Joi.object({
	defaultSiteTheme: Joi.string().required().trim().valid("light", "dark")
}).required()

export default function validateSetDefaultSiteTheme (req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = setDefaultSiteThemeSchema.validate(req.params)

		if (!_.isUndefined(error)) {
			res.status(400).json({ validationError: "Invalid default site theme" })
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate Default Site Theme" })
		return
	}
}
