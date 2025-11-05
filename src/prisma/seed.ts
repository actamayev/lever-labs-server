/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import isUndefined from "lodash/isUndefined"
import parseCSV from "../utils/parse-csv"
import parseJSON from "../utils/parse-json"
import PrismaClientClass from "../classes/prisma-client"
import deleteOrphanedRecords from "./delete-orphaned-records"

async function seedCareers(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const careers = parseCSV("../db-seed-data/career.csv") as CareerData[]

	console.info("Seeding careers...")

	// Add this line before upserting
	await deleteOrphanedRecords(prismaClient.career, careers, "career_id", "careers")

	await Promise.all(careers.map(career => {
		if (!career.career_id || !career.career_name) {
			throw new Error(`Invalid career data: ${JSON.stringify(career)}`)
		}
		return prismaClient.career.upsert({
			where: { career_id: career.career_id },
			update: { career_name: career.career_name },
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

	await deleteOrphanedRecords(prismaClient.challenge, challenges, "challenge_id", "challenges")

	await Promise.all(challenges.map(challenge => {
		if (!challenge.challenge_id || !challenge.challenge_name || !challenge.career_id) {
			throw new Error(`Invalid challenge data: ${JSON.stringify(challenge)}`)
		}
		return prismaClient.challenge.upsert({
			where: { challenge_id: challenge.challenge_id },
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
	}))
}

async function seedLessons(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const lessons = parseCSV("../db-seed-data/lesson.csv") as LessonData[]

	console.info("Seeding lessons...")

	await deleteOrphanedRecords(prismaClient.lesson, lessons, "lesson_id", "lessons")

	await Promise.all(lessons.map(lesson => {
		if (!lesson.lesson_id || !lesson.lesson_name || !lesson.lesson_order) {
			throw new Error(`Invalid lesson data: ${JSON.stringify(lesson)}`)
		}
		return prismaClient.lesson.upsert({
			where: { lesson_id: lesson.lesson_id },
			update: {
				lesson_name: lesson.lesson_name,
				lesson_description: lesson.lesson_description,
				lesson_order: lesson.lesson_order
			},
			create: {
				lesson_id: lesson.lesson_id,
				lesson_name: lesson.lesson_name,
				lesson_description: lesson.lesson_description,
				lesson_order: lesson.lesson_order
			}
		})
	}))
}

async function seedQuestions(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const questions = parseCSV("../db-seed-data/question.csv") as QuestionData[]

	console.info("Seeding questions...")

	await deleteOrphanedRecords(prismaClient.question, questions, "question_id", "questions")

	await Promise.all(questions.map(question => {
		if (!question.question_id || !question.question_type) {
			throw new Error(`Invalid question data: ${JSON.stringify(question)}`)
		}
		return prismaClient.question.upsert({
			where: { question_id: question.question_id },
			update: { question_type: question.question_type },
			create: {
				question_id: question.question_id,
				question_type: question.question_type
			}
		})
	}))
}

async function seedCodingBlocks(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const codingBlocks = parseJSON("../db-seed-data/coding_block.json") as CodingBlockData[]

	console.info("Seeding coding blocks...")

	await deleteOrphanedRecords(prismaClient.coding_block, codingBlocks, "coding_block_id", "coding blocks")

	await Promise.all(codingBlocks.map(block => {
		if (!block.coding_block_id || !block.coding_block_json) {
			throw new Error(`Invalid coding block data: ${JSON.stringify(block)}`)
		}
		return prismaClient.coding_block.upsert({
			where: { coding_block_id: block.coding_block_id },
			update: { coding_block_json: block.coding_block_json },
			create: {
				coding_block_id: block.coding_block_id,
				coding_block_json: block.coding_block_json
			}
		})
	}))
}

async function seedBlockToFunctionFlashcards(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const flashcards = parseCSV("../db-seed-data/block_to_function_flashcard.csv") as BlockToFunctionFlashcardData[]

	console.info("Seeding block to function flashcards...")

	await deleteOrphanedRecords(prismaClient.block_to_function_flashcard, flashcards, "question_id", "block to function flashcards")

	await Promise.all(flashcards.map(flashcard => {
		if (!flashcard.question_id || !flashcard.coding_block_id || !flashcard.question_text) {
			throw new Error(`Invalid block to function flashcard data: ${JSON.stringify(flashcard)}`)
		}
		return prismaClient.block_to_function_flashcard.upsert({
			where: { question_id: flashcard.question_id },
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
	const flashcards = parseJSON("../db-seed-data/function_to_block_flashcard.json") as FunctionToBlockFlashcardData[]

	console.info("Seeding function to block flashcards...")

	await deleteOrphanedRecords(prismaClient.function_to_block_flashcard, flashcards, "question_id", "function to block flashcards")

	await Promise.all(flashcards.map(flashcard => {
		if (!flashcard.question_id || !flashcard.question_text) {
			throw new Error(`Invalid function to block flashcard data: ${JSON.stringify(flashcard)}`)
		}
		return prismaClient.function_to_block_flashcard.upsert({
			where: { question_id: flashcard.question_id },
			update: { question_text: flashcard.question_text },
			create: {
				question_id: flashcard.question_id,
				question_text: flashcard.question_text
			}
		})
	}))
}

async function seedFillInTheBlanks(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const fillInBlanks = parseJSON("../db-seed-data/fill_in_the_blank.json") as FillInTheBlankData[]

	console.info("Seeding fill in the blanks...")

	await deleteOrphanedRecords(prismaClient.fill_in_the_blank, fillInBlanks, "question_id", "fill in the blanks")

	await Promise.all(fillInBlanks.map(fillInBlank => {
		if (
			!fillInBlank.question_id ||
			!fillInBlank.reference_solution_cpp ||
			!fillInBlank.initial_blockly_json ||
			!fillInBlank.question_text
		) {
			throw new Error(`Invalid fill in the blank data: ${JSON.stringify(fillInBlank)}`)
		}
		return prismaClient.fill_in_the_blank.upsert({
			where: { question_id: fillInBlank.question_id },
			update: {
				initial_blockly_json: fillInBlank.initial_blockly_json,
				reference_solution_cpp: fillInBlank.reference_solution_cpp,
				question_text: fillInBlank.question_text
			},
			create: {
				question_id: fillInBlank.question_id,
				initial_blockly_json: fillInBlank.initial_blockly_json,
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

	await deleteOrphanedRecords(
		prismaClient.fill_in_the_blank_block_bank,
		blockBanks,
		"fill_in_the_blank_block_bank_id",
		"fill in the blank block banks"
	)

	await Promise.all(blockBanks.map(blockBank => {
		if (!blockBank.fill_in_the_blank_block_bank_id || !blockBank.fill_in_the_blank_id || !blockBank.block_name_id) {
			console.error(blockBank)
			throw new Error(`Invalid fill in the blank block bank data: ${JSON.stringify(blockBank)}`)
		}
		return prismaClient.fill_in_the_blank_block_bank.upsert({
			where: { fill_in_the_blank_block_bank_id: blockBank.fill_in_the_blank_block_bank_id },
			update: {
				fill_in_the_blank_id: blockBank.fill_in_the_blank_id,
				block_name_id: blockBank.block_name_id
			},
			create: {
				fill_in_the_blank_block_bank_id: blockBank.fill_in_the_blank_block_bank_id,
				fill_in_the_blank_id: blockBank.fill_in_the_blank_id,
				block_name_id: blockBank.block_name_id
			}
		})
	}))
}

async function seedLessonQuestionMaps(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const maps = parseCSV("../db-seed-data/lesson_question_map.csv") as LessonQuestionMapData[]

	console.info("Seeding lesson question maps...")

	await deleteOrphanedRecords(prismaClient.lesson_question_map, maps, "lesson_question_map_id", "lesson question maps")

	await Promise.all(maps.map(map => {
		if (!map.lesson_question_map_id || !map.lesson_id || !map.question_id || isUndefined(map.order)) {
			throw new Error(`Invalid lesson question map data: ${JSON.stringify(map)}`)
		}
		return prismaClient.lesson_question_map.upsert({
			where: { lesson_question_map_id: map.lesson_question_map_id },
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

	await deleteOrphanedRecords(
		prismaClient.block_to_function_answer_choice,
		choices,
		"block_to_function_answer_choice_id",
		"block to function answer choices"
	)

	await Promise.all(choices.map(choice => {
		if (
			!choice.block_to_function_answer_choice_id ||
			!choice.block_to_function_flashcard_id ||
			!choice.function_description_text ||
			isUndefined(choice.is_correct)
		) {
			throw new Error(`Invalid block to function answer choice data: ${JSON.stringify(choice)}`)
		}
		return prismaClient.block_to_function_answer_choice.upsert({
			where: { block_to_function_answer_choice_id: choice.block_to_function_answer_choice_id },
			update: {
				block_to_function_flashcard_id: choice.block_to_function_flashcard_id,
				function_description_text: choice.function_description_text,
				is_correct: choice.is_correct
			},
			create: {
				block_to_function_answer_choice_id: choice.block_to_function_answer_choice_id,
				block_to_function_flashcard_id: choice.block_to_function_flashcard_id,
				function_description_text: choice.function_description_text,
				is_correct: choice.is_correct
			}
		})
	}))
}

async function seedFunctionToBlockAnswerChoices(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const choices = parseCSV("../db-seed-data/function_to_block_answer_choice.csv") as FunctionToBlockAnswerChoiceData[]

	console.info("Seeding function to block answer choices...")

	await deleteOrphanedRecords(
		prismaClient.function_to_block_answer_choice,
		choices,
		"function_to_block_answer_choice_id",
		"function to block answer choices"
	)

	await Promise.all(choices.map(choice => {
		if (
			!choice.function_to_block_answer_choice_id ||
			!choice.function_to_block_flashcard_id ||
			!choice.coding_block_id ||
			isUndefined(choice.is_correct)
		) {
			throw new Error(`Invalid function to block answer choice data: ${JSON.stringify(choice)}`)
		}
		return prismaClient.function_to_block_answer_choice.upsert({
			where: { function_to_block_answer_choice_id: choice.function_to_block_answer_choice_id },
			update: {
				function_to_block_flashcard_id: choice.function_to_block_flashcard_id,
				coding_block_id: choice.coding_block_id,
				is_correct: choice.is_correct
			},
			create: {
				function_to_block_answer_choice_id: choice.function_to_block_answer_choice_id,
				function_to_block_flashcard_id: choice.function_to_block_flashcard_id,
				coding_block_id: choice.coding_block_id,
				is_correct: choice.is_correct
			}
		})
	}))
}

async function seedBlockNames(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const blockNames = parseCSV("../db-seed-data/block_name.csv") as BlockNameData[]

	console.info("Seeding block names...")

	await deleteOrphanedRecords(prismaClient.block_name, blockNames, "block_name_id", "block names")

	await Promise.all(blockNames.map(blockName => {
		return prismaClient.block_name.upsert({
			where: { block_name_id: blockName.block_name_id },
			update: { block_name: blockName.block_name },
			create: {
				block_name_id: blockName.block_name_id,
				block_name: blockName.block_name
			}
		})
	}))
}

async function seedActionToCodeMultipleChoiceQuestions(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const questions = parseJSON("../db-seed-data/action_to_code_multiple_choice_question.json") as ActionToCodeMultipleChoiceQuestionData[]

	console.info("Seeding action to code multiple choice questions...")

	// eslint-disable-next-line max-len
	await deleteOrphanedRecords(prismaClient.action_to_code_multiple_choice_question, questions, "question_id", "action to code multiple choice questions")

	await Promise.all(questions.map(question => {
		if (!question.question_id || !question.question_text || !question.reference_solution_cpp) {
			throw new Error(`Invalid action to code multiple choice question data: ${JSON.stringify(question)}`)
		}
		return prismaClient.action_to_code_multiple_choice_question.upsert({
			where: { question_id: question.question_id },
			update: {
				question_text: question.question_text,
				reference_solution_cpp: question.reference_solution_cpp
			},
			create: {
				question_id: question.question_id,
				question_text: question.question_text,
				reference_solution_cpp: question.reference_solution_cpp
			}
		})
	}))
}

async function seedActionToCodeMultipleChoiceAnswerChoices(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	// eslint-disable-next-line max-len
	const choices = parseCSV("../db-seed-data/action_to_code_multiple_choice_answer_choice.csv") as ActionToCodeMultipleChoiceAnswerChoiceData[]

	console.info("Seeding action to code multiple choice answer choices...")

	await deleteOrphanedRecords(
		prismaClient.action_to_code_multiple_choice_answer_choice,
		choices,
		"action_to_code_multiple_choice_answer_choice_id",
		"action to code multiple choice answer choices"
	)

	await Promise.all(choices.map(choice => {
		if (
			!choice.action_to_code_multiple_choice_answer_choice_id ||
			!choice.action_to_code_multiple_choice_id ||
			!choice.coding_block_id ||
			isUndefined(choice.is_correct)
		) {
			throw new Error(`Invalid action to code multiple choice answer choice data: ${JSON.stringify(choice)}`)
		}
		return prismaClient.action_to_code_multiple_choice_answer_choice.upsert({
			where: { action_to_code_multiple_choice_answer_choice_id: choice.action_to_code_multiple_choice_answer_choice_id },
			update: {
				action_to_code_multiple_choice_id: choice.action_to_code_multiple_choice_id,
				coding_block_id: choice.coding_block_id,
				is_correct: choice.is_correct
			},
			create: {
				action_to_code_multiple_choice_answer_choice_id: choice.action_to_code_multiple_choice_answer_choice_id,
				action_to_code_multiple_choice_id: choice.action_to_code_multiple_choice_id,
				coding_block_id: choice.coding_block_id,
				is_correct: choice.is_correct
			}
		})
	}))
}

async function seedActionToCodeOpenEndedQuestions(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const questions = parseJSON("../db-seed-data/action_to_code_open_ended_question.json") as ActionToCodeOpenEndedQuestionData[]

	console.info("Seeding action to code open ended questions...")

	await deleteOrphanedRecords(
		prismaClient.action_to_code_open_ended_question,
		questions,
		"question_id",
		"action to code open ended questions"
	)

	await Promise.all(questions.map(question => {
		if (!question.question_id || !question.question_text || !question.initial_blockly_json || !question.reference_solution_cpp) {
			throw new Error(`Invalid action to code open ended question data: ${JSON.stringify(question)}`)
		}
		return prismaClient.action_to_code_open_ended_question.upsert({
			where: { question_id: question.question_id },
			update: {
				question_text: question.question_text,
				initial_blockly_json: question.initial_blockly_json,
				reference_solution_cpp: question.reference_solution_cpp
			},
			create: {
				question_id: question.question_id,
				question_text: question.question_text,
				initial_blockly_json: question.initial_blockly_json,
				reference_solution_cpp: question.reference_solution_cpp
			}
		})
	}))
}

async function seedActionToCodeOpenEndedQuestionBlockBanks(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	// eslint-disable-next-line max-len
	const blockBanks = parseCSV("../db-seed-data/action_to_code_open_ended_question_block_bank.csv") as ActionToCodeOpenEndedQuestionBlockBankData[]

	console.info("Seeding action to code open ended question block banks...")

	await deleteOrphanedRecords(
		prismaClient.action_to_code_open_ended_question_block_bank,
		blockBanks,
		"action_to_code_open_ended_question_block_bank_id",
		"action to code open ended question block banks"
	)

	await Promise.all(blockBanks.map(blockBank => {
		if (
			!blockBank.action_to_code_open_ended_question_block_bank_id ||
			!blockBank.action_to_code_open_ended_question_id ||
			!blockBank.block_name_id
		) {
			throw new Error(`Invalid action to code open ended question block bank data: ${JSON.stringify(blockBank)}`)
		}
		return prismaClient.action_to_code_open_ended_question_block_bank.upsert({
			where: { action_to_code_open_ended_question_block_bank_id: blockBank.action_to_code_open_ended_question_block_bank_id },
			update: {
				action_to_code_open_ended_question_id: blockBank.action_to_code_open_ended_question_id,
				block_name_id: blockBank.block_name_id
			},
			create: {
				action_to_code_open_ended_question_block_bank_id: blockBank.action_to_code_open_ended_question_block_bank_id,
				action_to_code_open_ended_question_id: blockBank.action_to_code_open_ended_question_id,
				block_name_id: blockBank.block_name_id
			}
		})
	}))
}

async function seedMatchingQuestions(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const matchingQuestions = parseCSV("../db-seed-data/matching_question.csv") as MatchingQuestionData[]

	console.info("Seeding matching questions...")

	await deleteOrphanedRecords(prismaClient.matching_question, matchingQuestions, "question_id", "matching questions")

	await Promise.all(matchingQuestions.map(question => {
		if (!question.question_id || !question.question_text) {
			throw new Error(`Invalid matching question data: ${JSON.stringify(question)}`)
		}
		return prismaClient.matching_question.upsert({
			where: { question_id: question.question_id },
			update: { question_text: question.question_text },
			create: {
				question_id: question.question_id,
				question_text: question.question_text
			}
		})
	}))
}

async function seedMatchingAnswerChoiceTexts(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const answerChoiceTexts = parseCSV("../db-seed-data/matching_answer_choice_text.csv") as MatchingAnswerChoiceTextData[]

	console.info("Seeding matching answer choice texts...")

	await deleteOrphanedRecords(
		prismaClient.matching_answer_choice_text,
		answerChoiceTexts,
		"matching_answer_choice_text_id",
		"matching answer choice texts"
	)

	await Promise.all(answerChoiceTexts.map(answerChoiceText => {
		if (!answerChoiceText.matching_answer_choice_text_id || !answerChoiceText.answer_choice_text) {
			throw new Error(`Invalid matching answer choice text data: ${JSON.stringify(answerChoiceText)}`)
		}
		return prismaClient.matching_answer_choice_text.upsert({
			where: { matching_answer_choice_text_id: answerChoiceText.matching_answer_choice_text_id },
			update: { answer_choice_text: answerChoiceText.answer_choice_text },
			create: {
				matching_answer_choice_text_id: answerChoiceText.matching_answer_choice_text_id,
				answer_choice_text: answerChoiceText.answer_choice_text
			}
		})
	}))
}

async function seedMatchingAnswerChoicePairs(): Promise<void> {
	const prismaClient = await PrismaClientClass.getPrismaClient()
	const pairs = parseCSV("../db-seed-data/matching_answer_choice_pair.csv") as MatchingAnswerChoicePairData[]

	console.info("Seeding matching answer choice pairs...")

	await deleteOrphanedRecords(
		prismaClient.matching_answer_choice_pair,
		pairs,
		"matching_answer_choice_pair_id",
		"matching answer choice pairs"
	)

	await Promise.all(pairs.map(pair => {
		if (
			!pair.matching_answer_choice_pair_id ||
			!pair.matching_question_id ||
			!pair.coding_block_id ||
			!pair.matching_answer_choice_text_id
		) {
			throw new Error(`Invalid matching answer choice pair data: ${JSON.stringify(pair)}`)
		}
		return prismaClient.matching_answer_choice_pair.upsert({
			where: { matching_answer_choice_pair_id: pair.matching_answer_choice_pair_id },
			update: {
				matching_question_id: pair.matching_question_id,
				coding_block_id: pair.coding_block_id,
				matching_answer_choice_text_id: pair.matching_answer_choice_text_id
			},
			create: {
				matching_answer_choice_pair_id: pair.matching_answer_choice_pair_id,
				matching_question_id: pair.matching_question_id,
				coding_block_id: pair.coding_block_id,
				matching_answer_choice_text_id: pair.matching_answer_choice_text_id
			}
		})
	}))
}


async function main(reverse: boolean = false): Promise<void> {
	try {
		const seedingFunctions = [
			seedCareers,
			seedChallenges,
			seedCodingBlocks,
			seedBlockNames,
			seedLessons,
			seedQuestions,
			seedLessonQuestionMaps,
			seedBlockToFunctionFlashcards,
			seedFunctionToBlockFlashcards,
			seedFillInTheBlanks,
			seedFillInTheBlankBlockBanks,
			seedActionToCodeMultipleChoiceQuestions,
			seedActionToCodeOpenEndedQuestions,
			seedMatchingQuestions,
			seedMatchingAnswerChoiceTexts,
			seedBlockToFunctionAnswerChoices,
			seedFunctionToBlockAnswerChoices,
			seedActionToCodeMultipleChoiceAnswerChoices,
			seedActionToCodeOpenEndedQuestionBlockBanks,
			seedMatchingAnswerChoicePairs
		]

		const functionsToRun = reverse ? seedingFunctions.reverse() : seedingFunctions

		for (const seedFunction of functionsToRun) {
			await seedFunction()
		}

		console.info("Seeding completed successfully")
	} catch (error) {
		console.error("Error during seeding:", error)
		process.exit(1)
	}
}

void main()
