import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts"
import StreamManager from "../../classes/stream-manager"

export default function stopChatbotStream(req: Request, res: Response): void {
	try {
		const { streamId } = req.body

		// Stop the stream
		const wasStopped = StreamManager.getInstance().stopStream(streamId)

		if (!wasStopped) {
			throw Error("Stream not found or already completed")
		}

		res.status(200).json({ success: "Stream stopped successfully"} as SuccessResponse)
		return
	} catch (error) {
		console.error("Stop chatbot stream error:", error)
		res.status(500).json({ error: "Internal Server Error: Unable to stop stream" } as ErrorResponse)
	}
}
