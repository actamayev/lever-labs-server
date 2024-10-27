import { Response, Request } from "express"
import addPipUUIDRecord from "../../db-operations/write/pip-uuid/add-pip-uuid-record"

export default async function addNewPipUUID (req: Request, res: Response): Promise<void> {
	try {
		const { pipUUID } = req.body as { pipUUID: string }

		await addPipUUIDRecord(pipUUID)

		res.status(200).json({ success: "Added new Pip UUID" })
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to add new Pip UUID" })
	}
}
