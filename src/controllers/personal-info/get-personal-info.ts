import { Request, Response } from "express"
import Encryptor from "../../classes/encryptor"
import { ErrorResponse, PersonalInfoResponse, TeacherData } from "@bluedotrobots/common-ts"

export default async function getPersonalInfo(req: Request, res: Response): Promise<void> {
	try {
		const { user } = req

		const encryptor = new Encryptor()
		const email = await encryptor.deterministicDecrypt(user.email__encrypted, "EMAIL_ENCRYPTION_KEY")

		const teacherData: TeacherData | null = user.teacher ? {
			teacherId: user.teacher.teacher_id,
			teacherFirstName: user.teacher.teacher_first_name,
			teacherLastName: user.teacher.teacher_last_name,
			isApproved: user.teacher.is_approved,
			schoolName: user.teacher.school.school_name
		} : null
		res.status(200).json({
			username: user.username,
			email,
			defaultSiteTheme: user.default_site_theme,
			profilePictureUrl: user.profile_picture?.image_url || null,
			sandboxNotesOpen: user.sandbox_notes_open,
			name: user.name,
			teacherData
		} satisfies PersonalInfoResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve personal info" } satisfies ErrorResponse)
		return
	}
}
