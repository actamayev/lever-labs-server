import _ from "lodash"
import { Request, Response, NextFunction } from "express"
import findPipUUID from "../../db-operations/read/find/find-pip-uuid"

export default async function attachPipUUIDId(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { pipUUID } = req.body.addPipToAccountData as { pipUUID: string }

		const pipUUIDData = await findPipUUID(pipUUID)

		if (_.isNull(pipUUIDData)) {
			res.status(500).json({ error: "Pip UUID doesn't exist"})
			return
		}

		req.pipUUIDData = pipUUIDData

		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm New Pip UUID Exists" })
	}
}
