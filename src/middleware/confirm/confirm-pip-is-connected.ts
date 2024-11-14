import { Request, Response, NextFunction } from "express"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default function confirmPipIsConnected(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const isUUIDConnected = BrowserSocketManager.getInstance().isUUIDConnected(pipUUID)

		if (isUUIDConnected === false) {
			res.status(400).json({ message: "Pip is not connected. Please connect to Pip"})
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm user is connected to this Pip" })
		return
	}
}
