import { Request, Response } from "express"
import { SidebarStates } from "@prisma/client"
import updateDefaultSidebarState from "../../db-operations/write/credentials/update-default-sidebar-state"

export default async function setDefaultSidebarState(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const defaultSidebarState = req.params.defaultSidebarState as SidebarStates
		await updateDefaultSidebarState(userId, defaultSidebarState)

		res.status(200).json({ success: `Sidebar state set to ${defaultSidebarState}` })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to set new default sidebar state" })
		return
	}
}
