import { Response, Request } from "express"
import { ErrorResponse, PipData } from "@bluedotrobots/common-ts"
import SendEsp32MessageManager from "../../classes/esp32/send-esp32-message-manager"
import retrieveUserPipUUIDsDetails from "../../db-operations/read/user-pip-uuid-map/retrieve-user-pip-uuids-details"

export default async function retrievePreviouslyAddedPips (req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const userPipData = await retrieveUserPipUUIDsDetails(userId)

		// for each of the pips that is online, request battery monitor data
		userPipData.forEach(pip => {
			if (pip.pipConnectionStatus !== "offline") {
				void SendEsp32MessageManager.getInstance().requestBatteryMonitorData(pip.pipUUID)
			}
		})

		res.status(200).json({ userPipData } satisfies { userPipData: PipData[]})
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve previously added Pips" } satisfies ErrorResponse)
		return
	}
}
