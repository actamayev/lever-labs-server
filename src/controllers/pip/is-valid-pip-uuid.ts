import _ from "lodash"
import { Response, Request } from "express"
import findPipUUID from "../../db-operations/read/find/find-pip-uuid"

export default async function isValidPipUUID(req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const pipUUIDData = await findPipUUID(pipUUID)

		if (_.isNull(pipUUIDData)) {
			res.status(400).json({ message: "Pip UUID doesn't exist"})
			return
		}

		if (_.isNull(pipUUIDData.pip_name)) res.status(200).json({ success: "Please add name." })
		else res.status(200).json({ success: "Name already added" })

		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to connect to Pip" })
		return
	}
}
