import { QuestionType } from "@prisma/client"

declare global {
	// Base lesson type used by learn endpoints
	interface Lesson {
		lessonUuid: string
		lessonName: string
		isCompleted: boolean
	}

	// Lesson with questions (used by get-single-lesson)
	interface LessonWithQuestions extends Lesson {
		lessonQuestionMap: LessonQuestionMap[]
	}

	// Ordering and mapping of questions within a lesson
	interface LessonQuestionMap {
		lessonQuestionMapId: number
		order: number
		question: Question
	}

	// Core question shape with optional polymorphic payloads
	interface Question {
		questionId: string
		questionType: QuestionType
		blockToFunctionFlashcard: {
			codingBlockId: number
			blockToFunctionAnswerChoice: BlockToFunctionAnswerChoice[]
		} | null
		functionToBlockFlashcard: {
			functionToBlockAnswerChoice: FunctionToBlockAnswerChoice[]
		} | null
		fillInTheBlank: {
			fillInTheBlankBlockBank: FillInTheBlankBlockBank[]
		} | null
	}

	// Nested answer choice/blocks types
	interface BlockToFunctionAnswerChoice {
		blockToFunctionAnswerChoiceId: number
		order: number
		functionDescriptionText: string
		isCorrect: boolean
	}

	interface FunctionToBlockAnswerChoice {
		functionToBlockAnswerChoiceId: number
		order: number
		codingBlockId: number
		isCorrect: boolean
	}

	interface FillInTheBlankBlockBank {
		fillInTheBlankBlockBankId: number
		order: number
		codingBlockId: number
		quantity: number
	}

	// API response envelopes
	interface LessonResponse {
		lesson: LessonWithQuestions
	}

	interface LessonsResponse {
		lessons: Lesson[]
	}
}

export {}
