import { OutgoingCqChallengeGeneralMessage, OutgoingSandboxChatData, SandboxChatMessage,
	OutgoingCqChallengeCheckCodeMessage, OutgoingCqChallengeHintMessage, CqChallengeChatMessage } from "@bluedotrobots/common-ts"

declare global {
	interface ProcessedCareerQuestChatData extends OutgoingCqChallengeGeneralMessage {
		careerQuestChatId: number
		conversationHistory: CqChallengeChatMessage[]
	}

	interface ProcessedCareerQuestCheckCodeMessage extends OutgoingCqChallengeCheckCodeMessage {
		careerQuestChatId: number
	}

	interface ProcessedCareerQuestHintMessage extends OutgoingCqChallengeHintMessage {
		careerQuestChatId: number
		conversationHistory: CqChallengeChatMessage[]
	}

	interface ProcessedSandboxChatData extends OutgoingSandboxChatData {
		sandboxChatId: number
		conversationHistory: SandboxChatMessage[]
	}

	interface CodeWithScore {
		isCorrect: boolean
		score: number
	}

	interface SimpleMessageData {
		role: "system" | "user" | "assistant"
		content: string
	}
}

export {}
