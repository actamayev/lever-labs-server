import { Request, Response, NextFunction } from "express"
import BrowserSocketManager from "../../classes/browser-socket-manager"

export default function confirmPipIsUnconnected(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	try {
		const { pipUUID } = req.body as { pipUUID: PipUUID }

		const isUUIDAlreadyConnected = BrowserSocketManager.getInstance().isUUIDConnected(pipUUID)

		// TODO: If that someone is me, then it should output a 200 message
		if (isUUIDAlreadyConnected === true) {
			res.status(400).json({ message: "Someone is already connected to this Pip"})
			return
		}
		next()
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to confirm no one else is connected to this Pip" })
		return
	}
}
