import { OutgoingCareerQuestGeneralMessage, OutgoingSandboxChatData, SandboxChatMessage,
	OutgoingCareerQuestCheckCodeMessage, OutgoingCareerQuestHintMessage, CareerQuestChatMessage } from "@bluedotrobots/common-ts"

declare global {
	interface ProcessedCareerQuestChatData extends OutgoingCareerQuestGeneralMessage {
		careerQuestChatId: number
		conversationHistory: CareerQuestChatMessage[]
	}

	interface ProcessedCareerQuestCheckCodeMessage extends OutgoingCareerQuestCheckCodeMessage {
		careerQuestChatId: number
	}

	interface ProcessedCareerQuestHintMessage extends OutgoingCareerQuestHintMessage {
		careerQuestChatId: number
		conversationHistory: CareerQuestChatMessage[]
	}

	interface ProcessedSandboxChatData extends OutgoingSandboxChatData {
		sandboxChatId: number
		conversationHistory: SandboxChatMessage[]
	}

	interface CodeWithScore {
		isCorrect: boolean
		score: number
	}
}

export {}
