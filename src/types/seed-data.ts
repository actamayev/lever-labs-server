import { QuestionType } from "@prisma/client"
import { CareerUUID, ChallengeUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import { BlocklyJson } from "@actamayev/lever-labs-common-ts/types/sandbox"

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
		lesson_order: number
		lesson_description?: string
	}

	interface QuestionData {
		question_id: string
		question_type: QuestionType
	}

	interface CodingBlockData {
		coding_block_id: number
		coding_block_json: BlocklyJson
		on_click_cpp_to_run?: string
		on_release_cpp_to_run?: string
		needs_manual_send_button?: boolean
	}

	interface BlockToFunctionFlashcardData {
		question_id: string
		coding_block_id: number
		question_text: string
	}

	interface FunctionToBlockFlashcardData {
		question_id: string
		question_text: string
	}

	interface FillInTheBlankData {
		question_id: string
		initial_blockly_json: BlocklyJson
		reference_solution_cpp: string
		question_text: string
	}

	interface FillInTheBlankBlockBankData {
		fill_in_the_blank_block_bank_id: number
		fill_in_the_blank_id: string
		block_name_id: number
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
	}

	interface FunctionToBlockAnswerChoiceData {
		function_to_block_answer_choice_id: number
		function_to_block_flashcard_id: string
		coding_block_id: number
		is_correct: boolean
	}

	interface BlockNameData {
		block_name_id: number
		block_name: string
	}

	interface ActionToCodeMultipleChoiceQuestionData {
		question_id: string
		question_text: string
		reference_solution_cpp: string
	}

	interface ActionToCodeMultipleChoiceAnswerChoiceData {
		action_to_code_multiple_choice_answer_choice_id: number
		action_to_code_multiple_choice_id: string
		coding_block_id: number
		is_correct: boolean
	}

	interface ActionToCodeOpenEndedQuestionData {
		question_id: string
		question_text: string
		initial_blockly_json: BlocklyJson
		reference_solution_cpp: string
	}

	interface ActionToCodeOpenEndedQuestionBlockBankData {
		action_to_code_open_ended_question_block_bank_id: number
		action_to_code_open_ended_question_id: string
		block_name_id: number
	}

	interface MatchingQuestionData {
		question_id: string
		question_text: string
	}

	interface MatchingAnswerChoiceTextData {
		matching_answer_choice_text_id: number
		answer_choice_text: string
	}

	interface MatchingAnswerChoicePairData {
		matching_answer_choice_pair_id: number
		matching_question_id: string
		coding_block_id: number
		matching_answer_choice_text_id: number
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
		| BlockNameData
		| ActionToCodeMultipleChoiceQuestionData
		| ActionToCodeMultipleChoiceAnswerChoiceData
		| ActionToCodeOpenEndedQuestionData
		| ActionToCodeOpenEndedQuestionBlockBankData
		| MatchingQuestionData
		| MatchingAnswerChoiceTextData
		| MatchingAnswerChoicePairData
}

export {}
