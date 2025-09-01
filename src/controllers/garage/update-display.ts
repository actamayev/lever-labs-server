import isNull from "lodash/isNull"
import { Response, Request } from "express"
import { PipUUID, ErrorResponse, SuccessResponse, MessageBuilder} from "@bluedotrobots/common-ts"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"

export default function updateDisplayEndpoint(req: Request, res: Response): void {
	try {
		const { pipUUID, buffer: rawBuffer } = req.body as { pipUUID: PipUUID, buffer: BufferLike }

		// Convert buffer if it's a Uint8Array-like object
		let buffer: Buffer
		if (Buffer.isBuffer(rawBuffer)) {
			buffer = rawBuffer
		} else if (typeof rawBuffer === "object") {
			// Convert Uint8Array-like object to Buffer
			const bufferArray = new Array(1024)
			for (let i = 0; i < 1024; i++) {
				bufferArray[i] = rawBuffer[i]
			}
			buffer = Buffer.from(bufferArray)
		} else {
			throw new Error("Invalid buffer format")
		}

		const displayBufferMessage = MessageBuilder.createDisplayBufferMessage(buffer)
		if (isNull(displayBufferMessage)) {
			throw new Error("Display buffer message is null")
		}
		void SendEsp32MessageManager.getInstance().sendBinaryMessage(pipUUID, displayBufferMessage)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to update display" } satisfies ErrorResponse)
		return
	}
}
