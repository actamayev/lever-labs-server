import { ActivityUUID, QuestionUUID } from "@bluedotrobots/common-ts"
import { ActivityTypes, LessonNames } from "@prisma/client"

declare global {
	interface SeededActivityData {
		activity_id: number
		lesson_name: LessonNames
		activity_type: ActivityTypes
		activity_name: string
		uuid: ActivityUUID
	}

	interface ReadingQuestionData {
		reading_question_id: number
		activity_id: number
		question_text: string
		uuid: QuestionUUID
	}

	interface ReadingQuestionAnswerChoice {
		reading_question_answer_choice_id: number
		reading_question_id: number
		answer_text: string
		is_correct: boolean
		explanation: string
	}

	interface ReadingSection {
		reading_block_id: number
		reading_id: number
		reading_block_name: string
	}

	type AllSeedData =
		| SeededActivityData
		| ReadingQuestionData
		| ReadingQuestionAnswerChoice
		| ReadingSection
}

export {}
