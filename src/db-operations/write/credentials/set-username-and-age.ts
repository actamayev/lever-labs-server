import { NewGoogleInfoRequest } from "@bluedotrobots/common-ts/types/api"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function setUsernameAndAge(
	userId: number,
	googleInfo: NewGoogleInfoRequest
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.credentials.update({
			where: {
				user_id: userId
			},
			data: { ...googleInfo }
		})
	} catch (error) {
		console.error(error)
		throw error
	}
}
