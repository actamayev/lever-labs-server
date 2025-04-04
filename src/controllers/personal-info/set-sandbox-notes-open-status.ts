import { Request, Response } from "express"
import updateSandboxNotesOpenStatus from "../../db-operations/write/credentials/update-sandbox-notes-open-status"

export default async function setSandboxNotesOpenStatus(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const isOpen = Boolean(req.params.isOpen as string)
		await updateSandboxNotesOpenStatus(userId, isOpen)

		res.status(200).json({ success: "" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to set new sandbox notes open status" })
		return
	}
}
