import { Response, Request } from "express"
import { ErrorResponse, SuccessResponse } from "@lever-labs/common-ts/types/api"
import StreamManager from "../../classes/stream-manager"

export default async function stopChatStream(req: Request, res: Response): Promise<void> {
	try {
		const { streamId } = req.body

		// Stop the stream
		const wasStopped = await StreamManager.getInstance().stopStream(streamId)

		if (!wasStopped) {
			console.info("Stream not found or already completed")
			return
		}

		res.status(200).json({ success: "Stream stopped successfully"} satisfies SuccessResponse)
		return
	} catch (error) {
		console.error("Stop chatbot stream error:", error)
		res.status(500).json({ error: "Internal Server Error: Unable to stop stream" } satisfies ErrorResponse)
	}
}
