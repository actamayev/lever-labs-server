import { Request, Response } from "express"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts/types/api"
import deleteSandboxChat from "../../db-operations/write/sandbox-chat/delete-sandbox-chat"

export default async function deleteSandboxChatController(req: Request, res: Response): Promise<void> {
	try {
		const { sandboxProjectId } = req

		await deleteSandboxChat(sandboxProjectId)

		res.status(200).json({ success: "Sandbox chat deleted successfully"} satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to delete sandbox chat" } satisfies ErrorResponse)
		return
	}
}
