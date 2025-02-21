import path from "path"
import Papa from "papaparse"
import { readFileSync } from "fs"
import { ActivityTypes, LessonNames } from "@prisma/client"

// Type guard functions
function isActivityData(data: unknown): data is SeededActivityData {
	const d = data as SeededActivityData
	return (
		typeof d === "object" &&
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        d !== null &&
        typeof d.activity_id === "number" &&
		typeof d.uuid === "string" &&
        Object.values(LessonNames).includes(d.lesson_name) &&
        Object.values(ActivityTypes).includes(d.activity_type)
	)
}

function isReadingQuestionData(data: unknown): data is ReadingQuestionData {
	const d = data as ReadingQuestionData
	return (
		typeof d === "object" &&
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        d !== null &&
        typeof d.reading_question_id === "number" &&
        typeof d.activity_id === "number" &&
        typeof d.question_text === "string"
	)
}

function isAnswerChoiceData(data: unknown): data is ReadingQuestionAnswerChoice {
	const d = data as ReadingQuestionAnswerChoice
	return (
		typeof d === "object" &&
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        d !== null &&
        typeof d.reading_question_answer_choice_id === "number" &&
        typeof d.reading_question_id === "number" &&
        typeof d.answer_text === "string" &&
        typeof d.is_correct === "boolean"
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

// eslint-disable-next-line max-lines-per-function
export default function parseCSV(filePath: string): AllSeedData[] {
	// eslint-disable-next-line security/detect-non-literal-fs-filename
	const csvFile = readFileSync(path.join(__dirname, filePath), "utf-8")
	const parsedData = Papa.parse(csvFile, {
		header: true,
		skipEmptyLines: true,
		transform: (value: string) => {
			const cleanValue = value.trim()
			if (cleanValue.toLowerCase() === "true") return true
			if (cleanValue.toLowerCase() === "false") return false
			const num = Number(cleanValue)
			if (!isNaN(num)) return num
			return cleanValue
		}
	}).data as Record<string, unknown>[]

	const cleanedData = parsedData.map(row => cleanObjectKeys(row))

	const fileName = path.basename(filePath)

	// Validate and type data based on file path
	if (fileName === "activities.csv") {
		return cleanedData.map((row, index) => {
			if (!isActivityData(row)) {
				throw new Error(`Invalid activity data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as SeededActivityData
		})
	}

	else if (fileName === "reading_questions.csv") {
		return cleanedData.map((row, index) => {
			if (!isReadingQuestionData(row)) {
				throw new Error(`Invalid reading question data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as ReadingQuestionData
		})
	}

	else if (fileName === "reading_questions_answer_choices.csv") {
		return cleanedData.map((row, index) => {
			if (!isAnswerChoiceData(row)) {
				throw new Error(`Invalid answer choice data at row ${index + 1}: ${JSON.stringify(row)}`)
			}
			return row as ReadingQuestionAnswerChoice
		})
	}

	throw new Error(`Unknown file type: ${filePath}`)
}
