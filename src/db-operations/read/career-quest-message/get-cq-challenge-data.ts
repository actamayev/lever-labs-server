import { isNull } from "lodash"
import { BinaryEvaluationResult, BlocklyJson, CareerQuestChatMessage } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

interface CQChallengeData {
	messages: CareerQuestChatMessage[]
	sandboxJson: BlocklyJson
}

// eslint-disable-next-line max-lines-per-function
export async function getCQChallengeData(
	userId: number,
	challengeId: string
): Promise<CQChallengeData> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		// Get chat messages from active career quest chat
		const chat = await prismaClient.career_quest_chat.findFirst({
			where: {
				career_quest_id: challengeId,
				user_id: userId,
				is_active: true
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
				},
				code_submissions: {
					orderBy: {
						created_at: "asc"
					},
					select: {
						user_code: true,
						created_at: true,
						evaluation_result: true,
					}
				},
				career_quest_hints: {
					orderBy: {
						created_at: "asc"
					},
					select: {
						hint_text: true,
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
		const messages: CareerQuestChatMessage[] = isNull(chat)
			? []
			: [...chat.messages.map(msg => ({
				content: msg.message_text,
				role: msg.sender === "USER" ? "user" as const : "assistant" as const,
				timestamp: new Date(msg.created_at)
			} satisfies CareerQuestChatMessage)),
			...chat.code_submissions.map(submission => ({
				content: "",
				role: "user" as const,
				timestamp: new Date(submission.created_at),
				codeSubmissionData: {
					userCode: submission.user_code,
					evaluationResult: submission.evaluation_result as unknown as BinaryEvaluationResult
				}
			} satisfies CareerQuestChatMessage)),
			...chat.career_quest_hints.map(hint => ({
				content: hint.hint_text,
				role: "assistant" as const,
				timestamp: new Date(hint.created_at),
				isHint: true
			} satisfies CareerQuestChatMessage))
			].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

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
