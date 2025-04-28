import { Request, Response } from "express"
import updateName from "../../db-operations/write/credentials/update-name"
import { ErrorResponse , SuccessResponse} from "@bluedotrobots/common-ts"
export default async function setName(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { name } = req.params
		await updateName(userId, name)

		res.status(200).json({ success: "" } as SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to set new name" } as ErrorResponse)
		return
	}
}
