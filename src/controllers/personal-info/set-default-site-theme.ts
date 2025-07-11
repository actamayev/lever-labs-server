import { Request, Response } from "express"
import { SiteThemes } from "@prisma/client"
import updateDefaultSiteTheme from "../../db-operations/write/credentials/update-default-site-theme"
import { ErrorResponse, SuccessResponse} from "@bluedotrobots/common-ts"

export default async function setDefaultSiteTheme(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const { defaultSiteTheme } = req.params as { defaultSiteTheme: SiteThemes }
		await updateDefaultSiteTheme(userId, defaultSiteTheme)

		res.status(200).json({ success: `Default site theme set to ${defaultSiteTheme}` } satisfies SuccessResponse)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to set new default site theme" } satisfies ErrorResponse)
		return
	}
}
