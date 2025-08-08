import { isEmpty, isNil } from "lodash"
import {
	BlocklyJson,
	CareerQuestChallengeData,
	ChallengeChatMessage,
	SandboxChatMessage,
	CareerQuestHint,
	CareerQuestCodeSubmission,
	ChallengeUUID,
	CareerProgressData
} from "@bluedotrobots/common-ts"
import PrismaClientClass from "../../../classes/prisma-client"

// eslint-disable-next-line max-lines-per-function
export default async function getUserChallengeData(
	userId: number,
	careerId: number
): Promise<CareerProgressData> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		// Get current user progress, all challenges, seen challenges, AND active career chat
		const [currentProgress, challenges, seenChallenges, activeCareerChat] = await Promise.all([
			// Get the most recent progress for this user/career
			prismaClient.career_user_progress.findFirst({
				where: {
					user_id: userId,
					career_id: careerId
				},
				select: {
					challenge_uuid_or_text_uuid: true
				},
				orderBy: {
					updated_at: "desc"
				}
			}),

			// Get all challenges for this career
			prismaClient.challenge.findMany({
				where: {
					career_id: careerId
				},
				select: {
					challenge_id: true,
					challenge_uuid: true
				},
				orderBy: {
					created_at: "asc"
				}
			}),

			// Get all challenges this user has seen for this career
			prismaClient.user_seen_challenges.findMany({
				where: {
					user_id: userId,
					challenge: {
						career_id: careerId
					}
				},
				select: {
					challenge: {
						select: {
							challenge_uuid: true
						}
					}
				}
			}),

			// NEW: Get active career chat for this user/career
			prismaClient.career_chat.findFirst({
				where: {
					user_id: userId,
					career_id: careerId,
					is_active: true
				},
				select: {
					career_chat_id: true,
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
		])

		const challengeIds = challenges.map(c => c.challenge_id)
		const currentChallengeUuidOrTextUuid = currentProgress?.challenge_uuid_or_text_uuid || ""

		// Extract seen challenge UUIDs
		const seenChallengeUUIDs = seenChallenges.map(sc => sc.challenge.challenge_uuid) as ChallengeUUID[]

		// Process career chat messages
		const careerChatMessages: SandboxChatMessage[] = activeCareerChat?.messages.map(msg => ({
			content: msg.message_text,
			role: msg.sender === "USER" ? "user" as const : "assistant" as const,
			timestamp: new Date(msg.created_at)
		})) || []

		if (isEmpty(challengeIds)) {
			return {
				currentChallengeUuidOrTextUuid,
				seenChallengeUUIDs,
				careerQuestChallengeData: [],
				careerChatMessages
			} satisfies CareerProgressData
		}

		// Batch fetch all related data for all challenges
		const [chats, allSubmissions, allHints, sandboxes] = await Promise.all([
			// Get all active chats for these challenges
			prismaClient.challenge_chat.findMany({
				where: {
					challenge_id: { in: challengeIds },
					user_id: userId,
					is_active: true
				},
				select: {
					challenge_id: true,
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
			}),

			// Get all code submissions for these challenges
			prismaClient.challenge_code_submission.findMany({
				where: {
					challenge_id: { in: challengeIds },
					user_id: userId
				},
				orderBy: {
					created_at: "asc"
				},
				select: {
					challenge_id: true,
					user_code: true,
					created_at: true,
					feedback: true,
					is_correct: true,
					score: true
				}
			}),

			// Get all hints for these challenges
			prismaClient.challenge_hint.findMany({
				where: {
					challenge_id: { in: challengeIds },
					user_id: userId
				},
				orderBy: {
					created_at: "asc"
				},
				select: {
					challenge_id: true,
					hint_text: true,
					created_at: true,
					hint_number: true,
					model_used: true
				}
			}),

			// Get all sandbox data for these challenges
			prismaClient.challenge_sandbox.findMany({
				where: {
					challenge_id: { in: challengeIds },
					user_id: userId
				},
				select: {
					challenge_id: true,
					challenge_sandbox_json: true
				}
			})
		])

		// Group data by challenge_id
		const chatsByChallenge = new Map(chats.map(chat => [chat.challenge_id, chat]))
		const submissionsByChallenge = allSubmissions.reduce((acc, sub) => {
			if (!acc.has(sub.challenge_id)) acc.set(sub.challenge_id, [])
			acc.get(sub.challenge_id)?.push(sub)
			return acc
		}, new Map<number, typeof allSubmissions>())

		const hintsByChallenge = allHints.reduce((acc, hint) => {
			if (!acc.has(hint.challenge_id)) acc.set(hint.challenge_id, [])
			acc.get(hint.challenge_id)?.push(hint)
			return acc
		}, new Map<number, typeof allHints>())

		const sandboxesByChallenge = new Map(sandboxes.map(sandbox => [sandbox.challenge_id, sandbox]))

		// Process each challenge
		// eslint-disable-next-line max-lines-per-function
		const results: CareerQuestChallengeData[] = challenges.map(challenge => {
			const chat = chatsByChallenge.get(challenge.challenge_id)
			const challengeSubmissions = submissionsByChallenge.get(challenge.challenge_id) || []
			const challengeHints = hintsByChallenge.get(challenge.challenge_id) || []
			const sandbox = sandboxesByChallenge.get(challenge.challenge_id)

			// Check if user has ever been correct for this challenge
			const hasEverBeenCorrect = challengeSubmissions.some(submission => submission.is_correct)

			// Process messages (only from active chat timeline)
			let messages: ChallengeChatMessage[] = []

			if (!isNil(chat)) {
				const chatCreatedAt = new Date(chat.created_at)

				// Filter submissions and hints to only those during active chat period
				const activeSubmissions = challengeSubmissions.filter(
					submission => new Date(submission.created_at) >= chatCreatedAt
				)
				const activeHints = challengeHints.filter(
					hint => new Date(hint.created_at) >= chatCreatedAt
				)

				const chatMessages = chat.messages.map(msg => ({
					content: msg.message_text,
					role: msg.sender === "USER" ? "user" as const : "assistant" as const,
					timestamp: new Date(msg.created_at)
				} satisfies ChallengeChatMessage))

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
				} satisfies ChallengeChatMessage))

				const hintMessages = activeHints.map(hint => ({
					content: hint.hint_text,
					role: "assistant" as const,
					timestamp: new Date(hint.created_at),
					isHint: true
				} satisfies ChallengeChatMessage))

				// Combine and sort all messages by timestamp
				messages = [...chatMessages, ...submissionMessages, ...hintMessages]
					.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
			}

			// Process sandbox JSON
			let sandboxJson: BlocklyJson | null = null
			if (!isNil(sandbox) && sandbox.challenge_sandbox_json) {
				try {
					sandboxJson = sandbox.challenge_sandbox_json as BlocklyJson
				} catch (parseError) {
					console.error("Failed to parse career_quest_sandbox_json:", parseError)
					sandboxJson = null
				}
			}

			// Format all hints and submissions with camelCase
			const formattedHints: CareerQuestHint[] = challengeHints.map(hint => ({
				hintText: hint.hint_text,
				createdAt: new Date(hint.created_at),
				hintNumber: hint.hint_number,
				modelUsed: hint.model_used
			}))

			const formattedSubmissions: CareerQuestCodeSubmission[] = challengeSubmissions.map(submission => ({
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
				hasEverBeenCorrect,
				challengeUUID: challenge.challenge_uuid as ChallengeUUID
			} satisfies CareerQuestChallengeData
		})

		return {
			currentChallengeUuidOrTextUuid,
			seenChallengeUUIDs,
			careerQuestChallengeData: results,
			careerChatMessages
		} satisfies CareerProgressData
	} catch (error) {
		console.error(error)
		throw error
	}
}
