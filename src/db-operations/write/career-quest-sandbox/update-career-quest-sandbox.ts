import { BlocklyJson } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateCareerQuestSandboxProject(
	userId: number,
	careerQuestId: string,
	newBlocklyJson: BlocklyJson
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.career_quest_sandbox.upsert({
			where: {
				user_id_career_quest_id: {
					user_id: userId,
					career_quest_id: careerQuestId
				}
			},
			update:{
				career_quest_sandbox_json: JSON.stringify(newBlocklyJson),
			},
			create: {
				career_quest_sandbox_json: JSON.stringify(newBlocklyJson),
				user_id: userId,
				career_quest_id: careerQuestId
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
