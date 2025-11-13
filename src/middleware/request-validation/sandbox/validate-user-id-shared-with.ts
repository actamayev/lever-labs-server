import Joi from "joi"
import isUndefined from "lodash/isUndefined"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, MessageResponse, ValidationErrorResponse } from "@lever-labs/common-ts/types/api"
import { SandboxProjectUUID } from "@lever-labs/common-ts/types/utils"
import checkSandboxProjectShareExists from "../../../db-operations/read/sandbox-project-shares/check-sandbox-project-share-exists"

const shareSandboxProjectSchema = Joi.object({
	userIdSharedWith: Joi.number().integer().positive().required()
}).required()

export default async function validateUserIdSharedWith(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { error } = shareSandboxProjectSchema.validate(req.body)

		if (!isUndefined(error)) {
			res.status(400).json({ validationError: error.details[0].message } satisfies ValidationErrorResponse)
			return
		}

		const { projectUUID } = req.params as { projectUUID: SandboxProjectUUID }
		const { userIdSharedWith } = req.body as { userIdSharedWith: number }

		const shareExists = await checkSandboxProjectShareExists(projectUUID, userIdSharedWith)

		if (shareExists) {
			res.status(400).json({ message: "Project is already shared with this user" } satisfies MessageResponse)
			return
		}

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to validate userIdSharedWith" } satisfies ErrorResponse)
		return
	}
}

