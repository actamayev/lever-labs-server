import { Request, Response } from "express"

export default function logout (_req: Request, res: Response): void {
	try {
		res.status(200).json({ success: "Logout successful" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Logout" })
		return
	}
}
