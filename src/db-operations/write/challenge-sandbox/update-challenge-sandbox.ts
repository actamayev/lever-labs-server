import { BlocklyJson } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function updateChallengeSandbox(
	userId: number,
	challengeId: number,
	newBlocklyJson: BlocklyJson
): Promise<void> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		await prismaClient.challenge_sandbox.upsert({
			where: {
				user_id_challenge_id: {
					user_id: userId,
					challenge_id: challengeId
				}
			},
			update:{
				challenge_sandbox_json: JSON.stringify(newBlocklyJson),
			},
			create: {
				challenge_sandbox_json: JSON.stringify(newBlocklyJson),
				user_id: userId,
				challenge_id: challengeId
			}
		})

		return
	} catch (error) {
		console.error(error)
		throw error
	}
}
