import { Request, Response } from "express"
import markProfilePictureInactive from "../../db-operations/write/profile-picture/mark-profile-picture-inactive"

export default async function removeCurrentProfilePicture (req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req

		await markProfilePictureInactive(userId)

		res.status(200).json({ success: "Removed Profile picture" })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to remove profile picture" })
		return
	}
}
