import { QuestionType } from "@prisma/client"
import { CareerUUID, ChallengeUUID } from "@lever-labs/common-ts/types/utils"
import { BlocklyJson } from "@lever-labs/common-ts/types/sandbox"

declare global {
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

	interface LessonData {
		lesson_id: string
		lesson_name: string
		lesson_description?: string
	}

	interface QuestionData {
		question_id: string
		question_type: QuestionType
	}

	interface CodingBlockData {
		coding_block_id: number
		block_name: string
		motor_speed?: number | null
		led_color?: string | null
		direction?: string | null
		delay_ms?: number | null
		color_sensor_detection_color?: string | null
		speaker_sound?: string | null
	}

	interface BlockToFunctionFlashcardData {
		question_id: string
		coding_block_id: number
	}

	interface FunctionToBlockFlashcardData {
		question_id: string
		question_text: string
	}

	interface FillInTheBlankData {
		question_id: string
		initial_blockly_json: BlocklyJson
		reference_solution_cpp: string
	}

	interface FillInTheBlankBlockBankData {
		fill_in_the_blank_block_bank_id: number
		fill_in_the_blank_id: string
		coding_block_id: number
		quantity: number
		order: number
	}

	interface LessonQuestionMapData {
		lesson_question_map_id: number
		lesson_id: string
		question_id: string
		order: number
	}

	interface BlockToFunctionAnswerChoiceData {
		block_to_function_answer_choice_id: number
		block_to_function_flashcard_id: string
		function_description_text: string
		is_correct: boolean
		order: number
	}

	interface FunctionToBlockAnswerChoiceData {
		function_to_block_answer_choice_id: number
		function_to_block_flashcard_id: string
		coding_block_id: number
		is_correct: boolean
		order: number
	}

	type AllSeedData =
		| CareerData
		| ChallengeData
		| LessonData
		| QuestionData
		| CodingBlockData
		| BlockToFunctionFlashcardData
		| FunctionToBlockFlashcardData
		| FillInTheBlankData
		| FillInTheBlankBlockBankData
		| LessonQuestionMapData
		| BlockToFunctionAnswerChoiceData
		| FunctionToBlockAnswerChoiceData
}

export {}
