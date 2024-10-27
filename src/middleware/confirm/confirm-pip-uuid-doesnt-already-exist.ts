import { Request, Response, NextFunction } from "express"
import doesPipUUIDExist from "../../db-operations/read/does-x-exist/does-pip-uuid-exist"

export default async function confirmPipUUIDDoesntAlreadyExist(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { pipUUID } = req.body as { pipUUID: string }

		const pipUUIDExists = await doesPipUUIDExist(pipUUID)

		if (pipUUIDExists === true) {
			res.status(500).json({ error: "Pip UUID Already exists"})
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm user hasn't already registered this pip UUID" })
	}
}
