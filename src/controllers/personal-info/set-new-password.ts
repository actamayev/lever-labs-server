import { Request, Response } from "express"
import Hash from "../../classes/hash"
import updatePassword from "../../db-operations/write/credentials/update-password"
import { ErrorResponse , SuccessResponse} from "@bluedotrobots/common-ts"
export default async function setNewPassword(req: Request, res: Response): Promise<void> {
	try {
		const { user } = req
		const { oldPassword, newPassword } = req.body

		if (user.auth_method === "google") {
			res.status(400).json({ message: "Please log in with Google" })
			return
		}

		const doPasswordsMatch = await Hash.checkPassword(oldPassword, user.password as HashedString)
		if (doPasswordsMatch === false) {
			res.status(400).json({ message: "Wrong password. Please try again." })
			return
		}

		const newHashedPassword = await Hash.hashCredentials(newPassword)

		await updatePassword(user.user_id, newHashedPassword)

		res.status(200).json({ success: "" } as SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to set new password" } as ErrorResponse)
		return
	}
}
