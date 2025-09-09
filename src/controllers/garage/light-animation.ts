import { Response, Request } from "express"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import { LightAnimation } from "@bluedotrobots/common-ts/types/garage"
import { PipUUID } from "@bluedotrobots/common-ts/types/utils"
import { MessageBuilder } from "@bluedotrobots/common-ts/message-builder"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts/types/api"
import { lightToLEDType } from "@bluedotrobots/common-ts/protocol"

export default function lightAnimationEndpoint(req: Request, res: Response): void {
	try {
		const { pipUUID, lightAnimation } = req.body as { pipUUID: PipUUID, lightAnimation: LightAnimation }

		void SendEsp32MessageManager.getInstance().sendBinaryMessage(
			pipUUID,
			MessageBuilder.createLightAnimationMessage(lightToLEDType[lightAnimation])
		)

		res.status(200).json({ success: "" } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to display light animation" } satisfies ErrorResponse)
		return
	}
}
