import Joi from "joi"
import _ from "lodash"
import { Request, Response, NextFunction } from "express"

const setDefaultSidebarStateSchem = Joi.object({
	defaultSidebarState: Joi.string().required().trim().valid("expanded", "collapsed")
}).required()

export default function validateSetSidebarState (req: Request, res: Response, next: NextFunction): void {
	try {
		const { error } = setDefaultSidebarStateSchem.validate(req.params)

		if (!_.isUndefined(error)) {
			res.status(400).json({ validationError: "Invalid sidebar state" })
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Validate sidebar state" })
		return
	}
}
