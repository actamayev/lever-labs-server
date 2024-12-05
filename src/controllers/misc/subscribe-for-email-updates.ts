import { Response, Request } from "express"
import addEmailUpdateSubscriber from "../../db-operations/write/email-update-subscriber/add-email-update-subscriber"

export default async function subscribeForEmailUpdates (req: Request, res: Response): Promise<void> {
	try {
		const { email } = req.body as { email: string }

		await addEmailUpdateSubscriber(email)

		res.status(200).json({ success: "" })
		return
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		console.error(error)
		if (error.code === "P2002") {
			res.status(400).json({ message: "Email is already subscribed." })
			return
		} else {
			res.status(500).json({ error: "Internal Server Error: Unable to subscribe user for email updates" })
			return
		}
	}
}
