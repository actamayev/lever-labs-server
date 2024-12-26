import { SidebarStates } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateDefaultSidebarState(userId: number, defaultSidebarState: SidebarStates): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.credentials.update({
			where: {
				user_id: userId
			},
			data: {
				default_sidebar_state: defaultSidebarState
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
