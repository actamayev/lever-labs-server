import { Request, Response } from "express"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import deleteSandboxChat from "../../db-operations/write/sandbox-chat/delete-sandbox-chat"
import { SandboxProjectUUID } from "@lever-labs/common-ts/types/utils"

export default async function deleteSandboxChatController(req: Request, res: Response): Promise<void> {
	try {
		const { projectUUID } = req.params as { projectUUID: SandboxProjectUUID }

		await deleteSandboxChat(projectUUID)

		res.status(200).json({ success: "Sandbox chat deleted successfully"} satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to delete sandbox chat" } satisfies ErrorResponse)
		return
	}
}
