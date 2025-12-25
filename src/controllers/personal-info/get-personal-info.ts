import { Request, Response } from "express"
import Encryptor from "../../classes/encryptor"
import { ErrorResponse, PersonalInfoResponse } from "@actamayev/lever-labs-common-ts/types/api"
import extractTeacherDataFromUserData from "../../utils/teacher/extract-teacher-data-from-user-data"

export default async function getPersonalInfo(req: Request, res: Response): Promise<void> {
	try {
		const { user } = req

		const encryptor = new Encryptor()
		const email = await encryptor.deterministicDecrypt(user.email__encrypted, "EMAIL_ENCRYPTION_KEY")

		res.status(200).json({
			username: user.username as string,
			email,
			defaultSiteTheme: user.default_site_theme,
			profilePictureUrl: user.profile_picture?.image_url || null,
			sandboxNotesOpen: user.sandbox_notes_open,
			name: user.name,
			teacherData: extractTeacherDataFromUserData(user)
		} satisfies PersonalInfoResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve personal info" } satisfies ErrorResponse)
		return
	}
}
