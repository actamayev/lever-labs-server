import { isNull } from "lodash"
import { BlocklyJson, CareerQuestChallengeData, CqChallengeChatMessage,
	CareerQuestHint, CareerQuestCodeSubmission } from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

// eslint-disable-next-line max-lines-per-function
export async function getCQChallengeData(
	userId: number,
	challengeId: number
): Promise<CareerQuestChallengeData> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		// Get chat messages from active career quest chat
		const chat = await prismaClient.career_quest_chat.findFirst({
			where: {
				challenge_id: challengeId,
				user_id: userId,
				is_active: true
			},
			select: {
				created_at: true,
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

		// Get ALL code submissions for this challenge
		const allSubmissions = await prismaClient.career_quest_code_submission.findMany({
			where: {
				challenge_id: challengeId,
				user_id: userId
			},
			orderBy: {
				created_at: "asc"
			},
			select: {
				user_code: true,
				created_at: true,
				feedback: true,
				is_correct: true,
				score: true
			}
		})

		// Get ALL hints for this challenge
		const allHints = await prismaClient.career_quest_hint.findMany({
			where: {
				challenge_id: challengeId,
				user_id: userId
			},
			orderBy: {
				created_at: "asc"
			},
			select: {
				hint_text: true,
				created_at: true,
				hint_number: true,
				model_used: true
			}
		})

		// Check if user has ever been correct
		const hasEverBeenCorrect = allSubmissions.some(submission => submission.is_correct)

		// Get sandbox data
		const sandbox = await prismaClient.career_quest_sandbox.findUnique({
			where: {
				user_id_challenge_id: {
					user_id: userId,
					challenge_id: challengeId
				}
			},
			select: {
				career_quest_sandbox_json: true
			}
		})

		// Process messages (only from active chat timeline)
		let messages: CqChallengeChatMessage[] = []

		if (!isNull(chat)) {
			const chatCreatedAt = new Date(chat.created_at)

			// Filter submissions and hints to only those during active chat period
			const activeSubmissions = allSubmissions.filter(
				submission => new Date(submission.created_at) >= chatCreatedAt
			)
			const activeHints = allHints.filter(
				hint => new Date(hint.created_at) >= chatCreatedAt
			)

			const chatMessages = chat.messages.map(msg => ({
				content: msg.message_text,
				role: msg.sender === "USER" ? "user" as const : "assistant" as const,
				timestamp: new Date(msg.created_at)
			} satisfies CqChallengeChatMessage))

			const submissionMessages = activeSubmissions.map(submission => ({
				content: "",
				role: "user" as const,
				timestamp: new Date(submission.created_at),
				codeSubmissionData: {
					userCode: submission.user_code,
					evaluationResult: {
						isCorrect: submission.is_correct,
						feedback: submission.feedback
					}
				}
			} satisfies CqChallengeChatMessage))

			const hintMessages = activeHints.map(hint => ({
				content: hint.hint_text,
				role: "assistant" as const,
				timestamp: new Date(hint.created_at),
				isHint: true
			} satisfies CqChallengeChatMessage))

			// Combine and sort all messages by timestamp
			messages = [...chatMessages, ...submissionMessages, ...hintMessages]
				.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
		}

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

		// Format all hints and submissions
		// Format all hints and submissions with camelCase
		const formattedHints: CareerQuestHint[] = allHints.map(hint => ({
			hintText: hint.hint_text,
			createdAt: new Date(hint.created_at),
			hintNumber: hint.hint_number,
			modelUsed: hint.model_used
		}))

		const formattedSubmissions: CareerQuestCodeSubmission[] = allSubmissions.map(submission => ({
			userCode: submission.user_code,
			isCorrect: submission.is_correct,
			score: submission.score,
			feedback: submission.feedback,
			createdAt: new Date(submission.created_at)
		}))

		return {
			messages,
			allHints: formattedHints,
			allSubmissions: formattedSubmissions,
			sandboxJson,
			hasEverBeenCorrect
		}
	} catch (error) {
		console.error(error)
		throw error
	}
}
