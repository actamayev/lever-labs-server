import { ErrorResponse } from "@bluedotrobots/common-ts"
import { Request, Response, NextFunction } from "express"
import findOrCreateSandboxChat from "../../db-operations/write/sandbox-chat/find-or-create-sandbox-chat"

export default async function attachSandboxChatId(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { sandboxProjectId } = req

		const sandboxChatId = await findOrCreateSandboxChat(sandboxProjectId)

		req.body.sandboxChatId = sandboxChatId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json(
			{ error: "Internal Server Error: Unable to confirm another user isn't connected to this Pip" } satisfies ErrorResponse
		)
		return
	}
}
