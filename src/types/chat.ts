import { ChatMessage, OutgoingCareerQuestGeneralMessage, OutgoingSandboxChatData,
	OutgoingCareerQuestCheckCodeMessage, OutgoingCareerQuestHintMessage } from "@bluedotrobots/common-ts"

declare global {
	interface BinaryEvaluationResult {
		isCorrect: boolean
		feedback?: string
	}

	interface ProcessedCareerQuestChatData extends OutgoingCareerQuestGeneralMessage {
		careerQuestChatId: number
		conversationHistory: ChatMessage[]
	}

	interface ProcessedCareerQuestCheckCodeMessage extends OutgoingCareerQuestCheckCodeMessage {
		careerQuestChatId: number
	}

	interface ProcessedCareerQuestHintMessage extends OutgoingCareerQuestHintMessage {
		careerQuestChatId: number
		conversationHistory: ChatMessage[]
	}

	interface ProcessedSandboxChatData extends OutgoingSandboxChatData {
		sandboxChatId: number
		conversationHistory: ChatMessage[]
	}
}

export {}
