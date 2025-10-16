/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import path from "path"
import Papa from "papaparse"
import { readFileSync } from "fs"
import { QuestionType } from "@prisma/client"

function isCareerData(data: unknown): data is CareerData {
	const d = data as CareerData
	return (
		typeof d === "object" &&
        d !== null &&
        typeof d.career_id === "number" &&
        typeof d.career_name === "string" &&
        typeof d.career_uuid === "string"
	)
}

function isChallengeData(data: unknown): data is ChallengeData {
	const d = data as ChallengeData
	return (
		typeof d === "object" &&
        d !== null &&
        typeof d.challenge_id === "number" &&
        typeof d.challenge_name === "string" &&
        typeof d.challenge_uuid === "string" &&
        typeof d.career_id === "number"
	)
}

function isLessonData(data: unknown): data is LessonData {
	const d = data as LessonData
	return (
		typeof d === "object" &&
        d !== null &&
        typeof d.lesson_id === "string" &&
        typeof d.lesson_name === "string"
	)
}

function isQuestionData(data: unknown): data is QuestionData {
	const d = data as QuestionData
	return (
		typeof d === "object" &&
        d !== null &&
        typeof d.question_id === "string" &&
        Object.values(QuestionType).includes(d.question_type)
	)
}

function isCodingBlockData(data: unknown): data is CodingBlockData {
	const d = data as CodingBlockData
	return (
		typeof d === "object" &&
        d !== null &&
        typeof d.coding_block_id === "number" &&
        typeof d.block_name === "string"
	)
}

function isBlockToFunctionFlashcardData(data: unknown): data is BlockToFunctionFlashcardData {
	const d = data as BlockToFunctionFlashcardData
	return (
		typeof d === "object" &&
        d !== null &&
        typeof d.question_id === "string" &&
        typeof d.coding_block_id === "number" &&
        typeof d.question_text === "string"
	)
}

function isFunctionToBlockFlashcardData(data: unknown): data is FunctionToBlockFlashcardData {
	const d = data as FunctionToBlockFlashcardData
	return (
		typeof d === "object" &&
        d !== null &&
        typeof d.question_id === "string" &&
        typeof d.question_text === "string"
	)
}

function isFillInTheBlankData(data: unknown): data is FillInTheBlankData {
	const d = data as FillInTheBlankData
	return (
		typeof d === "object" &&
        d !== null &&
        typeof d.question_id === "string" &&
        typeof d.initial_blockly_json === "string" &&
        typeof d.reference_solution_cpp === "string"
	)
}

function isFillInTheBlankBlockBankData(data: unknown): data is FillInTheBlankBlockBankData {
	const d = data as FillInTheBlankBlockBankData
	return (
		typeof d === "object" &&
        d !== null &&
        typeof d.fill_in_the_blank_block_bank_id === "number" &&
        typeof d.fill_in_the_blank_id === "string" &&
        typeof d.coding_block_id === "number"
	)
}

function isLessonQuestionMapData(data: unknown): data is LessonQuestionMapData {
	const d = data as LessonQuestionMapData
	return (
		typeof d === "object" &&
        d !== null &&
        typeof d.lesson_question_map_id === "number" &&
        typeof d.lesson_id === "string" &&
        typeof d.question_id === "string" &&
        typeof d.order === "number"
	)
}

function isBlockToFunctionAnswerChoiceData(data: unknown): data is BlockToFunctionAnswerChoiceData {
	const d = data as BlockToFunctionAnswerChoiceData
	return (
		typeof d === "object" &&
        d !== null &&
        typeof d.block_to_function_answer_choice_id === "number" &&
        typeof d.block_to_function_flashcard_id === "string" &&
        typeof d.function_description_text === "string" &&
        typeof d.is_correct === "boolean" &&
        typeof d.order === "number"
	)
}

function isFunctionToBlockAnswerChoiceData(data: unknown): data is FunctionToBlockAnswerChoiceData {
	const d = data as FunctionToBlockAnswerChoiceData
	return (
		typeof d === "object" &&
        d !== null &&
        typeof d.function_to_block_answer_choice_id === "number" &&
        typeof d.function_to_block_flashcard_id === "string" &&
        typeof d.coding_block_id === "number" &&
        typeof d.is_correct === "boolean" &&
        typeof d.order === "number"
	)
}

function cleanObjectKeys<T extends { [K in keyof T]: unknown }>(
	obj: Record<string, unknown>
): T {
	return Object.entries(obj).reduce((acc, [key, value]) => {
	  const cleanKey = key.trim()
	  acc[cleanKey as keyof T] = value as T[keyof T]
	  return acc
	}, {} as T)
}

// eslint-disable-next-line max-lines-per-function, complexity
export default function parseCSV(filePath: string): AllSeedData[] {
	// eslint-disable-next-line security/detect-non-literal-fs-filename
	const csvFile = readFileSync(path.join(__dirname, filePath), "utf-8")
	const parsedData = Papa.parse(csvFile, {
		header: true,
		skipEmptyLines: true,
		transform: (value: string) => {
			const cleanValue = value.trim()
			if (cleanValue === "") return null
			if (cleanValue.toLowerCase() === "true") return true
			if (cleanValue.toLowerCase() === "false") return false
			const num = Number(cleanValue)
			if (!isNaN(num)) return num
			return cleanValue
		}
	}).data as Record<string, unknown>[]

	const cleanedData = parsedData.map(row => cleanObjectKeys(row))

	const fileName = path.basename(filePath)

	if (fileName === "career.csv") {
		return cleanedData.map((row, index) => {
			if (!isCareerData(row)) {
				throw new Error(`Invalid career data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as CareerData
		})
	} else if (fileName === "challenge.csv") {
		return cleanedData.map((row, index) => {
			if (!isChallengeData(row)) {
				throw new Error(`Invalid challenge data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as ChallengeData
		})
	} else if (fileName === "lesson.csv") {
		return cleanedData.map((row, index) => {
			if (!isLessonData(row)) {
				throw new Error(`Invalid lesson data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as LessonData
		})
	} else if (fileName === "question.csv") {
		return cleanedData.map((row, index) => {
			if (!isQuestionData(row)) {
				throw new Error(`Invalid question data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as QuestionData
		})
	} else if (fileName === "coding_block.csv") {
		return cleanedData.map((row, index) => {
			if (!isCodingBlockData(row)) {
				throw new Error(`Invalid coding block data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as CodingBlockData
		})
	} else if (fileName === "block_to_function_flashcard.csv") {
		return cleanedData.map((row, index) => {
			if (!isBlockToFunctionFlashcardData(row)) {
				throw new Error(`Invalid block to function flashcard data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as BlockToFunctionFlashcardData
		})
	} else if (fileName === "function_to_block_flashcard.csv") {
		return cleanedData.map((row, index) => {
			if (!isFunctionToBlockFlashcardData(row)) {
				throw new Error(`Invalid function to block flashcard data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as FunctionToBlockFlashcardData
		})
	} else if (fileName === "fill_in_the_blank.csv") {
		return cleanedData.map((row, index) => {
			if (!isFillInTheBlankData(row)) {
				throw new Error(`Invalid fill in the blank data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			// Parse the JSON string
			const parsed = row as FillInTheBlankData
			try {
				parsed.initial_blockly_json = JSON.parse(parsed.initial_blockly_json as unknown as string)
			} catch (error) {
				throw new Error(`Invalid JSON in fill_in_the_blank at row ${index + 1}: ${error}`)
			}
			return parsed
		})
	} else if (fileName === "fill_in_the_blank_block_bank.csv") {
		return cleanedData.map((row, index) => {
			if (!isFillInTheBlankBlockBankData(row)) {
				throw new Error(`Invalid fill in the blank block bank data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as FillInTheBlankBlockBankData
		})
	} else if (fileName === "lesson_question_map.csv") {
		return cleanedData.map((row, index) => {
			if (!isLessonQuestionMapData(row)) {
				throw new Error(`Invalid lesson question map data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as LessonQuestionMapData
		})
	} else if (fileName === "block_to_function_answer_choice.csv") {
		return cleanedData.map((row, index) => {
			if (!isBlockToFunctionAnswerChoiceData(row)) {
				throw new Error(`Invalid block to function answer choice data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as BlockToFunctionAnswerChoiceData
		})
	} else if (fileName === "function_to_block_answer_choice.csv") {
		return cleanedData.map((row, index) => {
			if (!isFunctionToBlockAnswerChoiceData(row)) {
				throw new Error(`Invalid function to block answer choice data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as FunctionToBlockAnswerChoiceData
		})
	}

	throw new Error(`Unknown file type: ${filePath}`)
}
