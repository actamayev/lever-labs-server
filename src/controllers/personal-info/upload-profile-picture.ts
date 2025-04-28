import { isUndefined } from "lodash"
import { Request, Response } from "express"
import AwsS3 from "../../classes/aws/s3-manager"
import upsertProfilePictureRecordAndUpdateUser from "../../db-operations/write/simultaneous-writes/upsert-profile-picture-and-update-user"
import { ErrorResponse, MessageResponse, ProfilePictureUrl} from "@bluedotrobots/common-ts"

export default async function uploadProfilePicture (req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		if (isUndefined(req.file)) {
			res.status(400).json({ message: "No image uploaded" } as MessageResponse)
			return
		}

		const { buffer, originalname } = req.file

		const uuid = crypto.randomUUID()

		const profilePictureUrl = await AwsS3.getInstance().uploadImage(buffer, uuid)

		await upsertProfilePictureRecordAndUpdateUser(profilePictureUrl, originalname, uuid, userId)

		res.status(200).json({ profilePictureUrl } as ProfilePictureUrl)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to Upload Profile Picture" } as ErrorResponse)
		return
	}
}
