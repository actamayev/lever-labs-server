import { Response, Request } from "express"
import generatePipUUID from "../../utils/generate-pip-uuid"
import addPipUUIDRecord from "../../db-operations/write/pip-uuid/add-pip-uuid-record"
import { PipUUID, ErrorResponse } from "@bluedotrobots/common-ts"

export default async function addNewPipUUID (_req: Request, res: Response): Promise<void> {
	try {
		let generatedPipUUID: PipUUID

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		while (true) {
			generatedPipUUID = generatePipUUID()
			const success = await addPipUUIDRecord(generatedPipUUID)
			if (success) break // Exit loop if the UUID was successfully created
		}

		res.status(200).json({ generatedPipUUID })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to add new Pip UUID" } as ErrorResponse)
		return
	}
}
