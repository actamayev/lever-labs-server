import { isNull } from "lodash"
import { BlocklyJson, ChatMessage } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

interface CQChallengeData {
	messages: ChatMessage[]
	sandboxJson: BlocklyJson
}

// eslint-disable-next-line max-lines-per-function
export async function getCQChallengeData(
	userId: number,
	challengeId: string
): Promise<CQChallengeData> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		// Get chat messages
		const chat = await prismaClient.career_quest_chat.findUnique({
			where: {
				career_quest_id_user_id: {
					career_quest_id: challengeId,
					user_id: userId
				}
			},
			select: {
				messages: {
					orderBy: {
						created_at: "asc"
					},
					select: {
						message_text: true,
						sender: true,
						created_at: true
					}
				}
			}
		})

		// Get sandbox data
		const sandbox = await prismaClient.career_quest_sandbox.findUnique({
			where: {
				user_id_career_quest_id: {
					user_id: userId,
					career_quest_id: challengeId
				}
			},
			select: {
				career_quest_sandbox_json: true
			}
		})

		// Process messages
		const messages: ChatMessage[] = isNull(chat) ? [] : chat.messages.map(msg => ({
			content: msg.message_text,
			role: msg.sender === "USER" ? "user" as const : "assistant" as const,
			timestamp: msg.created_at
		}))

		// Process sandbox JSON
		let sandboxJson: object = {}
		if (!isNull(sandbox) && sandbox.career_quest_sandbox_json) {
			try {
				sandboxJson = sandbox.career_quest_sandbox_json as BlocklyJson
			} catch (parseError) {
				console.error("Failed to parse career_quest_sandbox_json:", parseError)
				sandboxJson = {}
			}
		}

		return {
			messages,
			sandboxJson
		}
	} catch (error) {
		console.error(error)
		throw error
	}
}
