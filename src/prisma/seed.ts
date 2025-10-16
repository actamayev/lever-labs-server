/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import isUndefined from "lodash/isUndefined"
import { BlocklyJson } from "@lever-labs/common-ts/types/sandbox"
import parseCSV from "../utils/parse-csv"
import PrismaClientClass from "../classes/prisma-client"

async function seedCareers(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const careers = parseCSV("../db-seed-data/career.csv") as CareerData[]

	console.info("Seeding careers...")
	await Promise.all(careers.map(career => {
		if (
			!career.career_id ||
			!career.career_name
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

async function seedLessons(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const lessons = parseCSV("../db-seed-data/lesson.csv") as LessonData[]

	console.info("Seeding lessons...")
	await Promise.all(lessons.map(lesson => {
		if (
			!lesson.lesson_id ||
			!lesson.lesson_name
		) {
			throw new Error(`Invalid lesson data: ${JSON.stringify(lesson)}`)
		}
		return prismaClient.lesson.upsert({
			where: {
				lesson_id: lesson.lesson_id
			},
			update: {
				lesson_name: lesson.lesson_name,
				lesson_description: lesson.lesson_description
			},
			create: {
				lesson_id: lesson.lesson_id,
				lesson_name: lesson.lesson_name,
				lesson_description: lesson.lesson_description
			}
		})
	}))
}

async function seedQuestions(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const questions = parseCSV("../db-seed-data/question.csv") as QuestionData[]

	console.info("Seeding questions...")
	await Promise.all(questions.map(question => {
		if (
			!question.question_id ||
			!question.question_type
		) {
			throw new Error(`Invalid question data: ${JSON.stringify(question)}`)
		}
		return prismaClient.question.upsert({
			where: {
				question_id: question.question_id
			},
			update: {
				question_type: question.question_type
			},
			create: {
				question_id: question.question_id,
				question_type: question.question_type
			}
		})
	}))
}

async function seedCodingBlocks(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const codingBlocks = parseCSV("../db-seed-data/coding_block.csv") as CodingBlockData[]

	console.info("Seeding coding blocks...")
	await Promise.all(codingBlocks.map(block => {
		if (
			!block.coding_block_id ||
			!block.block_name
		) {
			throw new Error(`Invalid coding block data: ${JSON.stringify(block)}`)
		}
		return prismaClient.coding_block.upsert({
			where: {
				coding_block_id: block.coding_block_id
			},
			update: {
				block_name: block.block_name,
				led_color: block.led_color,
				color_sensor_detection_color: block.color_sensor_detection_color,
				speaker_tone: block.speaker_tone
			},
			create: {
				coding_block_id: block.coding_block_id,
				block_name: block.block_name,
				led_color: block.led_color,
				color_sensor_detection_color: block.color_sensor_detection_color,
				speaker_tone: block.speaker_tone
			}
		})
	}))
}

async function seedBlockToFunctionFlashcards(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const flashcards = parseCSV("../db-seed-data/block_to_function_flashcard.csv") as BlockToFunctionFlashcardData[]

	console.info("Seeding block to function flashcards...")
	await Promise.all(flashcards.map(flashcard => {
		if (
			!flashcard.question_id ||
			!flashcard.coding_block_id ||
			!flashcard.question_text
		) {
			throw new Error(`Invalid block to function flashcard data: ${JSON.stringify(flashcard)}`)
		}
		return prismaClient.block_to_function_flashcard.upsert({
			where: {
				question_id: flashcard.question_id
			},
			update: {
				coding_block_id: flashcard.coding_block_id,
				question_text: flashcard.question_text
			},
			create: {
				question_id: flashcard.question_id,
				coding_block_id: flashcard.coding_block_id,
				question_text: flashcard.question_text
			}
		})
	}))
}

async function seedFunctionToBlockFlashcards(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const flashcards = parseCSV("../db-seed-data/function_to_block_flashcard.csv") as FunctionToBlockFlashcardData[]

	console.info("Seeding function to block flashcards...")
	await Promise.all(flashcards.map(flashcard => {
		if (
			!flashcard.question_id ||
			!flashcard.question_text
		) {
			throw new Error(`Invalid function to block flashcard data: ${JSON.stringify(flashcard)}`)
		}
		return prismaClient.function_to_block_flashcard.upsert({
			where: {
				question_id: flashcard.question_id
			},
			update: {
				question_text: flashcard.question_text
			},
			create: {
				question_id: flashcard.question_id,
				question_text: flashcard.question_text
			}
		})
	}))
}

async function seedFillInTheBlanks(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const fillInBlanks = parseCSV("../db-seed-data/fill_in_the_blank.csv") as FillInTheBlankData[]

	console.info("Seeding fill in the blanks...")
	await Promise.all(fillInBlanks.map(fillInBlank => {
		if (
			!fillInBlank.question_id ||
			!fillInBlank.initial_blockly_json ||
			!fillInBlank.reference_solution_cpp ||
			!fillInBlank.question_text
		) {
			throw new Error(`Invalid fill in the blank data: ${JSON.stringify(fillInBlank)}`)
		}
		return prismaClient.fill_in_the_blank.upsert({
			where: {
				question_id: fillInBlank.question_id
			},
			update: {
				initial_blockly_json: fillInBlank.initial_blockly_json as BlocklyJson,
				reference_solution_cpp: fillInBlank.reference_solution_cpp,
				question_text: fillInBlank.question_text
			},
			create: {
				question_id: fillInBlank.question_id,
				initial_blockly_json: fillInBlank.initial_blockly_json as BlocklyJson,
				reference_solution_cpp: fillInBlank.reference_solution_cpp,
				question_text: fillInBlank.question_text
			}
		})
	}))
}

async function seedFillInTheBlankBlockBanks(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const blockBanks = parseCSV("../db-seed-data/fill_in_the_blank_block_bank.csv") as FillInTheBlankBlockBankData[]

	console.info("Seeding fill in the blank block banks...")
	await Promise.all(blockBanks.map(blockBank => {
		if (
			!blockBank.fill_in_the_blank_block_bank_id ||
			!blockBank.fill_in_the_blank_id ||
			!blockBank.coding_block_id
		) {
			console.error(blockBank)
			throw new Error(`Invalid fill in the blank block bank data: ${JSON.stringify(blockBank)}`)
		}
		return prismaClient.fill_in_the_blank_block_bank.upsert({
			where: {
				fill_in_the_blank_block_bank_id: blockBank.fill_in_the_blank_block_bank_id
			},
			update: {
				fill_in_the_blank_id: blockBank.fill_in_the_blank_id,
				coding_block_id: blockBank.coding_block_id,
			},
			create: {
				fill_in_the_blank_block_bank_id: blockBank.fill_in_the_blank_block_bank_id,
				fill_in_the_blank_id: blockBank.fill_in_the_blank_id,
				coding_block_id: blockBank.coding_block_id,
			}
		})
	}))
}

async function seedLessonQuestionMaps(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const maps = parseCSV("../db-seed-data/lesson_question_map.csv") as LessonQuestionMapData[]

	console.info("Seeding lesson question maps...")
	await Promise.all(maps.map(map => {
		if (
			!map.lesson_question_map_id ||
			!map.lesson_id ||
			!map.question_id ||
			isUndefined(map.order)
		) {
			throw new Error(`Invalid lesson question map data: ${JSON.stringify(map)}`)
		}
		return prismaClient.lesson_question_map.upsert({
			where: {
				lesson_question_map_id: map.lesson_question_map_id
			},
			update: {
				lesson_id: map.lesson_id,
				question_id: map.question_id,
				order: map.order
			},
			create: {
				lesson_question_map_id: map.lesson_question_map_id,
				lesson_id: map.lesson_id,
				question_id: map.question_id,
				order: map.order
			}
		})
	}))
}

async function seedBlockToFunctionAnswerChoices(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const choices = parseCSV("../db-seed-data/block_to_function_answer_choice.csv") as BlockToFunctionAnswerChoiceData[]

	console.info("Seeding block to function answer choices...")
	await Promise.all(choices.map(choice => {
		if (
			!choice.block_to_function_answer_choice_id ||
			!choice.block_to_function_flashcard_id ||
			!choice.function_description_text ||
			isUndefined(choice.is_correct) ||
			isUndefined(choice.order)
		) {
			throw new Error(`Invalid block to function answer choice data: ${JSON.stringify(choice)}`)
		}
		return prismaClient.block_to_function_answer_choice.upsert({
			where: {
				block_to_function_answer_choice_id: choice.block_to_function_answer_choice_id
			},
			update: {
				block_to_function_flashcard_id: choice.block_to_function_flashcard_id,
				function_description_text: choice.function_description_text,
				is_correct: choice.is_correct,
				order: choice.order
			},
			create: {
				block_to_function_answer_choice_id: choice.block_to_function_answer_choice_id,
				block_to_function_flashcard_id: choice.block_to_function_flashcard_id,
				function_description_text: choice.function_description_text,
				is_correct: choice.is_correct,
				order: choice.order
			}
		})
	}))
}

async function seedFunctionToBlockAnswerChoices(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const choices = parseCSV("../db-seed-data/function_to_block_answer_choice.csv") as FunctionToBlockAnswerChoiceData[]

	console.info("Seeding function to block answer choices...")
	await Promise.all(choices.map(choice => {
		if (
			!choice.function_to_block_answer_choice_id ||
			!choice.function_to_block_flashcard_id ||
			!choice.coding_block_id ||
			isUndefined(choice.is_correct) ||
			isUndefined(choice.order)
		) {
			throw new Error(`Invalid function to block answer choice data: ${JSON.stringify(choice)}`)
		}
		return prismaClient.function_to_block_answer_choice.upsert({
			where: {
				function_to_block_answer_choice_id: choice.function_to_block_answer_choice_id
			},
			update: {
				function_to_block_flashcard_id: choice.function_to_block_flashcard_id,
				coding_block_id: choice.coding_block_id,
				is_correct: choice.is_correct,
				order: choice.order
			},
			create: {
				function_to_block_answer_choice_id: choice.function_to_block_answer_choice_id,
				function_to_block_flashcard_id: choice.function_to_block_flashcard_id,
				coding_block_id: choice.coding_block_id,
				is_correct: choice.is_correct,
				order: choice.order
			}
		})
	}))
}

async function main(): Promise<void> {
	try {
		await seedCareers()
		await seedChallenges()

		// Seed lesson system
		await seedCodingBlocks()
		await seedLessons()
		await seedQuestions()

		// Seed flashcard types (depends on questions and coding blocks)
		await seedBlockToFunctionFlashcards()
		await seedFunctionToBlockFlashcards()
		await seedFillInTheBlanks()

		// Seed answer choices and block banks (depends on flashcards)
		await seedBlockToFunctionAnswerChoices()
		await seedFunctionToBlockAnswerChoices()
		await seedFillInTheBlankBlockBanks()

		// Seed lesson-question relationships (depends on lessons and questions)
		await seedLessonQuestionMaps()

		console.info("Seeding completed successfully")
	} catch (error) {
		console.error("Error during seeding:", error)
		process.exit(1)
	}
}

void main()
