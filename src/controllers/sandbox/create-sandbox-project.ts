import { Response, Request } from "express"
import createSandboxProjectDB from "../../db-operations/write/sandbox-project/create-sandbox-project"
import { ErrorResponse } from "@bluedotrobots/common-ts"
export default async function createSandboxProject(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req

		const sandboxProject = await createSandboxProjectDB(userId)

		res.status(200).json({ sandboxProject })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to create sandbox project" } as ErrorResponse)
		return
	}
}
