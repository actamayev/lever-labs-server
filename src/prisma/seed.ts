import parseCSV from "../utils/parse-csv"
import PrismaClientClass from "../classes/prisma-client"

// eslint-disable-next-line max-lines-per-function
async function main(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	try {
		// Parse CSVs
		const activities = parseCSV("../db-seed-data/activities.csv") as SeededActivityData[]
		const questions = parseCSV("../db-seed-data/reading_questions.csv") as ReadingQuestionData[]
		const answerChoices = parseCSV("../db-seed-data/reading_questions_answer_choices.csv") as ReadingQuestionAnswerChoice[]

		// Seed activities
		console.info("Seeding activities...")
		await Promise.all(activities.map(activity =>
			prismaClient.activity.upsert({
				where: {
					activity_id: activity.activity_id
				},
				update: {
					activity_type: activity.activity_type,
					lesson_name: activity.lesson_name
				},
				create: {
					activity_id: activity.activity_id,
					activity_type: activity.activity_type,
					lesson_name: activity.lesson_name
				}
			})
		))

		// Seed reading questions
		console.info("Seeding reading questions...")
		await Promise.all(questions.map(question =>
			prismaClient.reading_question.upsert({
				where: {
					reading_question_id: question.reading_question_id
				},
				update: {
					activity_id: question.activity_id,
					question_text: question.question_text
				},
				create: {
					reading_question_id: question.reading_question_id,
					activity_id: question.activity_id,
					question_text: question.question_text
				}
			})
		))

		// Seed answer choices
		console.info("Seeding answer choices...")
		await Promise.all(answerChoices.map(choice =>
			prismaClient.reading_question_answer_choice.upsert({
				where: {
					reading_question_answer_choice_id: choice.reading_question_answer_choice_id
				},
				update: {
					reading_question_id: choice.reading_question_id,
					answer_text: choice.answer_text,
					is_correct: choice.is_correct
				},
				create: {
					reading_question_answer_choice_id: choice.reading_question_answer_choice_id,
					reading_question_id: choice.reading_question_id,
					answer_text: choice.answer_text,
					is_correct: choice.is_correct
				}
			})
		))

		console.info("Seeding completed successfully")
	} catch (error) {
		console.error("Error during seeding:", error)
		process.exit(1)
	}
}

void main()
