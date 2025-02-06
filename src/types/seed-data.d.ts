import { ActivityTypes, LessonNames } from "@prisma/client"
declare global {
	interface SeededActivityData {
		activity_id: number
		lesson_name: LessonNames
		activity_type: ActivityTypes
	}

	interface ReadingQuestionData {
		reading_question_id: number
		activity_id: number
		question_text: string
	}

	interface ReadingQuestionAnswerChoice {
		reading_question_answer_choice_id: number
		reading_question_id: number
		answer_text: string
		is_correct: boolean
	}

	type AllSeedData =
		| SeededActivityData
		| ReadingQuestionData
		| ReadingQuestionAnswerChoice
}

export {}
