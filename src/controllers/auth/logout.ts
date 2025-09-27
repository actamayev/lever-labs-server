import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import { Request, Response } from "express"
import { clearAuthCookie } from "../../middleware/cookie-helpers"

export default function logout(_req: Request, res: Response): void {
	try {
		clearAuthCookie(res)
		res.status(200).json({ success: "Logout successful" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Logout" } satisfies ErrorResponse)
		return
	}
}
