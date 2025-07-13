import { Request, Response } from "express"
import updateSandboxNotesOpenStatus from "../../db-operations/write/credentials/update-sandbox-notes-open-status"
import { ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"

export default async function setSandboxNotesOpenStatus(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const isOpen = req.params.isOpen === "true"
		await updateSandboxNotesOpenStatus(userId, isOpen)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to set new sandbox notes open status" } satisfies ErrorResponse)
		return
	}
}
