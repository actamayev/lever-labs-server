import { Response, Request } from "express"
import retrieveUserPipUUIDsDetails from "../../db-operations/read/user-pip-uuid-map/retrieve-user-pip-uuids-details"
import { ErrorResponse, PipData } from "@bluedotrobots/common-ts"

export default async function retrievePreviouslyAddedPips (req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const userPipData = await retrieveUserPipUUIDsDetails(userId)

		res.status(200).json({ userPipData } as { userPipData: PipData[]})
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retreive previously added Pips" } as ErrorResponse)
		return
	}
}
