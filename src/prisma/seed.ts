import isUndefined from "lodash/isUndefined"
import parseCSV from "../utils/parse-csv"
import PrismaClientClass from "../classes/prisma-client"

async function seedActivities(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const activities = parseCSV("../db-seed-data/activities.csv") as SeededActivityData[]

	console.info("Seeding activities...")
	await Promise.all(activities.map(activity => {
		if (
			!activity.activity_id ||
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			!activity.lesson_name || !activity.activity_type ||
			!activity.activity_name ||
			!activity.uuid
		) {
			throw new Error(`Invalid activity data: ${JSON.stringify(activity)}`)
		}
		// const uuid = crypto.randomUUID()
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
				activity_uuid: activity.uuid,
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
		if (
			!question.reading_question_id ||
			!question.activity_id ||
			!question.question_text ||
			!question.uuid
		) {
			throw new Error(`Invalid question data: ${JSON.stringify(question)}`)
		}
		// const uuid = crypto.randomUUID()
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
				reading_question_uuid: question.uuid
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

async function seedReadingSections(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const readingSections = parseCSV("../db-seed-data/reading_sections.csv") as ReadingSection[]

	console.info("Seeding reading sections...")
	await Promise.all(readingSections.map(readingSection => {
		if (
			!readingSection.reading_block_id ||
			!readingSection.reading_id ||
			!readingSection.reading_block_name
		) {
			throw new Error(`Invalid reading section data: ${JSON.stringify(readingSection)}`)
		}
		return prismaClient.reading_block.upsert({
			where: {
				reading_block_id: readingSection.reading_block_id
			},
			update: {
				reading_id: readingSection.reading_id,
				reading_block_name: readingSection.reading_block_name
			},
			create: {
				reading_block_id: readingSection.reading_block_id,
				reading_id: readingSection.reading_id,
				reading_block_name: readingSection.reading_block_name
			}
		})
	}))
}

async function seedCareers(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const careers = parseCSV("../db-seed-data/career.csv") as CareerData[]

	console.info("Seeding careers...")
	await Promise.all(careers.map(career => {
		if (
			!career.career_id ||
			!career.career_name ||
			!career.career_uuid
		) {
			throw new Error(`Invalid career data: ${JSON.stringify(career)}`)
		}
		return prismaClient.career.upsert({
			where: {
				career_id: career.career_id
			},
			update: {
				career_name: career.career_name
			},
			create: {
				career_id: career.career_id,
				career_name: career.career_name,
				career_uuid: career.career_uuid
			}
		})
	}))
}

async function seedChallenges(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const challenges = parseCSV("../db-seed-data/challenge.csv") as ChallengeData[]

	console.info("Seeding challenges...")
	await Promise.all(challenges.map(challenge => {
		if (
			!challenge.challenge_id ||
			!challenge.challenge_name ||
			!challenge.challenge_uuid ||
			!challenge.career_id
		) {
			throw new Error(`Invalid challenge data: ${JSON.stringify(challenge)}`)
		}
		return prismaClient.challenge.upsert({
			where: {
				challenge_id: challenge.challenge_id
			},
			update: {
				challenge_name: challenge.challenge_name,
				career_id: challenge.career_id
			},
			create: {
				challenge_id: challenge.challenge_id,
				challenge_name: challenge.challenge_name,
				challenge_uuid: challenge.challenge_uuid,
				career_id: challenge.career_id
			}
		})
	} ))
}

async function main(): Promise<void> {
	try {
		await seedActivities()

		await seedReadingQuestions()

		await seedAnswerChoices()

		await seedReadingSections()

		await seedCareers()

		await seedChallenges()

		console.info("Seeding completed successfully")
	} catch (error) {
		console.error("Error during seeding:", error)
		process.exit(1)
	}
}

void main()
