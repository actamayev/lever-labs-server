import { Request, Response } from "express"
import Encryptor from "../../classes/encryptor"

export default async function getPersonalInfo(req: Request, res: Response): Promise<void> {
	try {
		const { user } = req

		const encryptor = new Encryptor()
		const email = await encryptor.deterministicDecrypt(user.email__encrypted, "EMAIL_ENCRYPTION_KEY")

		res.status(200).json({
			username: user.username,
			email,
			defaultSiteTheme: user.default_site_theme,
			profilePictureUrl: null, // TODO: Later retrieve this
			defaultSidebarState: user.default_sidebar_state
		})
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve personal info" })
		return
	}
}
