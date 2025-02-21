import { ProgressStatus } from "@prisma/client"

declare global {
	type ActivityUUID = string & { readonly __brand: unique symbol }

	interface UserActivityProgress {
		status: ProgressStatus
		activity_uuid: ActivityUUID
	}

	interface RetrievedQuestions {
		questionText: string
		readingQuestionId: number
		questionAnswerChoices: {
			answerText: string
			isCorrect: boolean
			explanation: string
			didUserSelectAnswer: boolean
		}[]
	}
}

export {}
