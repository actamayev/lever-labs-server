import isUndefined from "lodash/isUndefined"
import parseCSV from "../utils/parse-csv"
import PrismaClientClass from "../classes/prisma-client"

async function seedActivities(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const activities = parseCSV("../db-seed-data/activities.csv") as SeededActivityData[]

	console.info("Seeding activities...")
	await Promise.all(activities.map(activity => {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!activity.activity_id || !activity.lesson_name || !activity.activity_type || !activity.activity_name) {
			throw new Error(`Invalid activity data: ${JSON.stringify(activity)}`)
		}
		const uuid = crypto.randomUUID()
		return prismaClient.activity.upsert({
			where: {
				activity_id: activity.activity_id
			},
			update: {
				activity_type: activity.activity_type,
				lesson_name: activity.lesson_name,
				activity_name: activity.activity_name
			},
			create: {
				activity_id: activity.activity_id,
				activity_type: activity.activity_type,
				lesson_name: activity.lesson_name,
				activity_uuid: uuid,
				activity_name: activity.activity_name
			}
		})
	}))
}

async function seedReadingQuestions(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const questions = parseCSV("../db-seed-data/reading_questions.csv") as ReadingQuestionData[]

	// Seed reading questions
	console.info("Seeding reading questions...")
	await Promise.all(questions.map(question => {
		if (!question.reading_question_id || !question.question_text || !question.activity_id) {
			throw new Error(`Invalid question data: ${JSON.stringify(question)}`)
		}
		const uuid = crypto.randomUUID()
		return prismaClient.reading_question.upsert({
			where: {
				reading_question_id: question.reading_question_id
			},
			update: {
				activity_id: question.activity_id,
				question_text: question.question_text,
			},
			create: {
				reading_question_id: question.reading_question_id,
				activity_id: question.activity_id,
				question_text: question.question_text,
				reading_question_uuid: uuid
			}
		})
	}))
}

async function seedAnswerChoices(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const answerChoices = parseCSV("../db-seed-data/reading_questions_answer_choices.csv") as ReadingQuestionAnswerChoice[]

	console.info("Seeding answer choices...")
	await Promise.all(answerChoices.map(choice => {
		if (
			!choice.reading_question_answer_choice_id ||
			!choice.reading_question_id ||
			!choice.answer_text ||
			isUndefined(choice.is_correct) ||
			!choice.explanation
		) {
			throw new Error(`Invalid choice data: ${JSON.stringify(choice)}`)
		}
		return prismaClient.reading_question_answer_choice.upsert({
			where: {
				reading_question_answer_choice_id: choice.reading_question_answer_choice_id
			},
			update: {
				reading_question_id: choice.reading_question_id,
				answer_text: choice.answer_text,
				is_correct: choice.is_correct,
				explanation: choice.explanation
			},
			create: {
				reading_question_answer_choice_id: choice.reading_question_answer_choice_id,
				reading_question_id: choice.reading_question_id,
				answer_text: choice.answer_text,
				is_correct: choice.is_correct,
				explanation: choice.explanation
			}
		})
	} ))
}

async function main(): Promise<void> {
	try {
		await seedActivities()

		await seedReadingQuestions()

		await seedAnswerChoices()

		console.info("Seeding completed successfully")
	} catch (error) {
		console.error("Error during seeding:", error)
		process.exit(1)
	}
}

void main()
