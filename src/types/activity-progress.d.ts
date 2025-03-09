import { ActivityTypes, ProgressStatus } from "@prisma/client"

declare global {
	type ActivityUUID = string & { readonly __brand: unique symbol }
	type QuestionUUID = string & { readonly __brand: unique symbol }

	interface UserActivityProgress {
		status: ProgressStatus
		activityUUID: ActivityUUID
		activityType: ActivityTypes
		activityName: string
	}

	interface RetrievedQuestions {
		questionText: string
		readingQuestionId: number
		readingQuestionUUID: QuestionUUID
		questionAnswerChoices: {
			answerText: string
			isCorrect: boolean
			explanation: string
			didUserSelectAnswer: boolean
		}[]
	}
}

export {}
