import { ErrorResponse } from "@actamayev/lever-labs-common-ts/types/api"
import { Request, Response, NextFunction } from "express"
import findOrCreateSandboxChat from "../../db-operations/write/sandbox-chat/find-or-create-sandbox-chat"
import { SandboxProjectUUID } from "@actamayev/lever-labs-common-ts/types/utils"

export default async function attachSandboxChatId(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const { projectUUID } = req.params as { projectUUID: SandboxProjectUUID }

		const sandboxChatId = await findOrCreateSandboxChat(projectUUID)

		req.body.sandboxChatId = sandboxChatId
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json(
			{ error: "Internal Server Error: Unable to attach sandbox chat id" } satisfies ErrorResponse
		)
		return
	}
}
