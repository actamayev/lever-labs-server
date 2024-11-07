import { SiteThemes } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateDefaultSiteTheme(userId: number, defaultSiteTheme: SiteThemes): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.credentials.update({
			where: {
				user_id: userId
			},
			data: {
				default_site_theme: defaultSiteTheme
			}
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
