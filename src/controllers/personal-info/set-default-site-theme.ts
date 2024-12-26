import { Request, Response } from "express"
import { SiteThemes } from "@prisma/client"
import updateDefaultSiteTheme from "../../db-operations/write/credentials/update-default-site-theme"

export default async function setDefaultSiteTheme(req: Request, res: Response): Promise<void> {
	try {
		const { user } = req
		const defaultSiteTheme = req.params.defaultSiteTheme as SiteThemes
		await updateDefaultSiteTheme(user.user_id, defaultSiteTheme)

		res.status(200).json({ success: `Default site theme set to ${defaultSiteTheme}` })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to set new default site theme" })
		return
	}
}
