import { ActivityTypes, LessonNames } from "@prisma/client"
import { CareerUUID, ChallengeUUID } from "@lever-labs/common-ts/types/utils"
import { ActivityUUID, QuestionUUID } from "@lever-labs/common-ts/types/lab"

declare global {
	interface SeededActivityData {
		activity_id: ActivityUUID
		lesson_name: LessonNames
		activity_type: ActivityTypes
		activity_name: string
	}

	interface ReadingQuestionData {
		reading_question_id: QuestionUUID
		activity_id: ActivityUUID
		question_text: string
	}

	interface ReadingQuestionAnswerChoice {
		reading_question_answer_choice_id: number
		reading_question_id: QuestionUUID
		answer_text: string
		is_correct: boolean
		explanation: string
	}

	interface ReadingSection {
		reading_block_id: number
		reading_id: ActivityUUID
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
