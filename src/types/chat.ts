import { OutgoingSandboxChatData, SandboxChatMessage,
	OutgoingChallengeGeneralMessage, OutgoingChallengeCheckCodeMessage,
	OutgoingChallengeHintMessage, ChallengeChatMessage, OutgoingCareerMessage } from "@lever-labs/common-ts/types/chat"

declare global {
	interface ProcessedChallengeGeneralMessage extends OutgoingChallengeGeneralMessage {
		challengeChatId: number
		conversationHistory: ChallengeChatMessage[]
	}

	interface ProcessedChallengeCheckCodeMessage extends OutgoingChallengeCheckCodeMessage {
		challengeChatId: number
	}

	interface ProcessedChallengeHintMessage extends OutgoingChallengeHintMessage {
		challengeChatId: number
		conversationHistory: ChallengeChatMessage[]
	}

	interface ProcessedSandboxChatData extends OutgoingSandboxChatData {
		sandboxChatId: number
		conversationHistory: SandboxChatMessage[]
	}

	interface ProcessedCareerChatData extends OutgoingCareerMessage {
		careerChatId: number
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
