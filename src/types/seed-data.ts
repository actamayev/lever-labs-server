import { ActivityTypes, LessonNames } from "@prisma/client"
import { CareerUUID, ChallengeUUID } from "@bluedotrobots/common-ts/types/utils"
import { ActivityUUID, QuestionUUID } from "@bluedotrobots/common-ts/types/lab"

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

	interface CareerData {
		career_id: number
		career_name: string
		career_uuid: CareerUUID
	}

	interface ChallengeData {
		challenge_id: number
		challenge_name: string
		challenge_uuid: ChallengeUUID
		career_id: number
	}

	type AllSeedData =
		| SeededActivityData
		| ReadingQuestionData
		| ReadingQuestionAnswerChoice
		| ReadingSection
		| CareerData
		| ChallengeData
}

export {}
