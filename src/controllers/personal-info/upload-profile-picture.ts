import { isUndefined } from "lodash"
import { Request, Response } from "express"
import { ErrorResponse, MessageResponse, ProfilePictureUrl} from "@actamayev/lever-labs-common-ts/types/api"
import AwsS3 from "../../classes/aws/s3-manager"
import upsertProfilePicture from "../../db-operations/write/profile-picture/upsert-profile-picture"

export default async function uploadProfilePicture (req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		if (isUndefined(req.file)) {
			res.status(400).json({ message: "No image uploaded" } satisfies MessageResponse)
			return
		}

		const { buffer, originalname } = req.file

		const uuid = crypto.randomUUID()

		const profilePictureUrl = await AwsS3.getInstance().uploadImage(buffer, uuid)

		await upsertProfilePicture(profilePictureUrl, originalname, uuid, userId)

		res.status(200).json({ profilePictureUrl } satisfies ProfilePictureUrl)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Upload Profile Picture" } satisfies ErrorResponse)
		return
	}
}
