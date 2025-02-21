import { Response, Request } from "express"

export default function generateUUID(req: Request, res: Response): void {
	try {
		const uuid = crypto.randomUUID()
		res.status(200).json({ uuid })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to generate UUID" })
		return
	}
}
