// import { isNull } from "lodash"
// import { Request, Response, NextFunction } from "express"
// import { ErrorResponse, OutgoingCqChallengeCheckCodeMessage,
// 	OutgoingCqChallengeGeneralMessage, OutgoingCqChallengeHintMessage} from "@bluedotrobots/common-ts"
// import findChallengeIdFromUUID from "../../db-operations/read/find/find-challenge-id-from-uuid"

// export default async function attachChallengeId(
// 	req: Request,
// 	res: Response,
// 	next: NextFunction
// ): Promise<void> {
// 	try {
// 		// eslint-disable-next-line max-len
// 		const chatData = req.body as OutgoingCqChallengeGeneralMessage | OutgoingCqChallengeCheckCodeMessage | OutgoingCqChallengeHintMessage

// 		const challengeId = await findChallengeIdFromUUID(chatData.challengeUUID)
// 		if (isNull(challengeId)) {
// 			res.status(400).json( { error: "Invalid challenge UUID" } satisfies ErrorResponse)
// 			return
// 		}

// 		req.body.challengeId = challengeId
// 		next()
// 	} catch (error) {
// 		console.error(error)
// 		res.status(500).json(
// 			{ error: "Internal Server Error: Unable to attach career quest chat id" } satisfies ErrorResponse
// 		)
// 		return
// 	}
// }
