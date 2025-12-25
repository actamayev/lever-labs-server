import { CareerUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function findCareerIdFromUUID(careerUUID: CareerUUID): Promise<number | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const retrievedCareer = await prismaClient.career.findFirst({
			where: {
				career_uuid: careerUUID
			}
		})

		return retrievedCareer?.career_id || null
	} catch (error) {
		console.error(error)
		throw error
	}
}
