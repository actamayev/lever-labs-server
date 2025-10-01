import { QuestionType } from "@prisma/client"

declare global {
	// Base lesson type
	interface Lesson {
		lessonUuid: string
		lessonName: string
	}

	// Lesson with questions
	interface LessonWithQuestions extends Lesson {
		lessonQuestionMap: LessonQuestionMap[]
	}

	// Lesson question mapping
	interface LessonQuestionMap {
		lessonQuestionMapId: number
		order: number
		question: Question
	}

	// Base question type
	interface Question {
		questionId: string
		questionType: QuestionType
	}

	// Block to function question
	interface BlockToFunctionQuestion extends Question {
		blockToFunctionFlashcard: {
			codingBlockId: number
			blockToFunctionAnswerChoice: BlockToFunctionAnswerChoice[]
		} | null
	}

	// Function to block question
	interface FunctionToBlockQuestion extends Question {
		functionToBlockFlashcard: {
			functionToBlockAnswerChoice: FunctionToBlockAnswerChoice[]
		} | null
	}

	// Fill in the blank question
	interface FillInTheBlankQuestion extends Question {
		fillInTheBlank: {
			fillInTheBlankBlockBank: FillInTheBlankBlockBank[]
		} | null
	}

	// Answer choice types
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

	interface GetBlockToFunctionQuestionsDbReturn extends LessonQuestionMap {
		question: BlockToFunctionQuestion
	}

	interface GetFunctionToBlockQuestionsDbReturn extends LessonQuestionMap {
		question: FunctionToBlockQuestion
	}

	interface GetFillInTheBlankQuestionsDbReturn extends LessonQuestionMap {
		question: FillInTheBlankQuestion
	}

	// API response types
	interface LessonResponse {
		lesson: LessonWithQuestions
	}

	interface LessonsResponse {
		lessons: Lesson[]
	}

	interface QuestionsResponse {
		questions: (LessonQuestionMap & {
			question: BlockToFunctionQuestion | FunctionToBlockQuestion | FillInTheBlankQuestion
		})[]
	}
}

export {}
