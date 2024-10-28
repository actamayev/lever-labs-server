import { SiteThemes } from "@prisma/client"
import PrismaClientClass from "../../../classes/prisma-client"

export async function addLocalUser(userFields: NewLocalUserFields): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const user = await prismaClient.credentials.create({
			data: userFields
		})

		return user.user_id
	} catch (error) {
		console.error(error)
		throw error
	}
}

export async function addGoogleUser(
	encryptedEmail: DeterministicEncryptedString,
	siteTheme: SiteThemes
): Promise<number> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const user = await prismaClient.credentials.create({
			data: {
				email__encrypted: encryptedEmail,
				auth_method: "google",
				default_site_theme: siteTheme
			}
		})

		return user.user_id
	} catch (error) {
		console.error(error)
		throw error
	}
}
