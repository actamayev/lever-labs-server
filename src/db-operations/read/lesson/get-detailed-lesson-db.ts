import { isEmpty } from "lodash"
import { DetailedLesson, LessonQuestionMap } from "@lever-labs/common-ts/types/learn"
import PrismaClientClass from "../../../classes/prisma-client"
import { QuestionUUID, LessonUUID } from "@lever-labs/common-ts/types/utils"

// eslint-disable-next-line max-lines-per-function
export default async function getDetailedLessonDb(lessonId: LessonUUID, userId: number): Promise<DetailedLesson | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const lesson = await prismaClient.lesson.findUnique({
			where: {
				lesson_id: lessonId
			},
			select: {
				lesson_id: true,
				lesson_name: true,
				completed_user_lesson: {
					where: { user_id: userId },
					select: { user_id: true },
					take: 1
				},
				lesson_question_map: {
					select: {
						lesson_question_map_id: true,
						order: true,
						question: {
							select: {
								question_id: true,
								question_type: true,
								block_to_function_flashcard: {
									select: {
										coding_block_id: true,
										block_to_function_answer_choice: {
											select: {
												block_to_function_answer_choice_id: true,
												order: true,
												function_description_text: true,
												is_correct: true
											}
										}
									}
								},
								function_to_block_flashcard: {
									select: {
										function_to_block_answer_choice: {
											select: {
												function_to_block_answer_choice_id: true,
												order: true,
												coding_block_id: true,
												is_correct: true
											}
										}
									}
								},
								fill_in_the_blank: {
									select: {
										fill_in_the_blank_block_bank: {
											select: {
												fill_in_the_blank_block_bank_id: true,
												order: true,
												coding_block_id: true,
												quantity: true
											}
										}
									}
								}
							}
						}
					},
					orderBy: {
						order: "asc"
					}
				}
			}
		})

		if (!lesson) return null

		return {
			lessonId: lesson.lesson_id as LessonUUID,
			lessonName: lesson.lesson_name,
			isCompleted: !isEmpty(lesson.completed_user_lesson),
			lessonQuestionMap: lesson.lesson_question_map.map(map => ({
				lessonQuestionMapId: map.lesson_question_map_id,
				order: map.order,
				question: {
					questionId: map.question.question_id as QuestionUUID,
					questionType: map.question.question_type,
					blockToFunctionFlashcard: map.question.block_to_function_flashcard ? {
						codingBlockId: map.question.block_to_function_flashcard.coding_block_id,
						// eslint-disable-next-line max-len
						blockToFunctionAnswerChoice: map.question.block_to_function_flashcard.block_to_function_answer_choice.map(choice => ({
							blockToFunctionAnswerChoiceId: choice.block_to_function_answer_choice_id,
							order: choice.order,
							functionDescriptionText: choice.function_description_text,
							isCorrect: choice.is_correct
						}))
					} : null,
					functionToBlockFlashcard: map.question.function_to_block_flashcard ? {
						// eslint-disable-next-line max-len
						functionToBlockAnswerChoice: map.question.function_to_block_flashcard.function_to_block_answer_choice.map(choice => ({
							functionToBlockAnswerChoiceId: choice.function_to_block_answer_choice_id,
							order: choice.order,
							codingBlockId: choice.coding_block_id,
							isCorrect: choice.is_correct
						}))
					} : null,
					fillInTheBlank: map.question.fill_in_the_blank ? {
						fillInTheBlankBlockBank: map.question.fill_in_the_blank.fill_in_the_blank_block_bank.map(bank => ({
							fillInTheBlankBlockBankId: bank.fill_in_the_blank_block_bank_id,
							order: bank.order,
							codingBlockId: bank.coding_block_id,
							quantity: bank.quantity
						}))
					} : null
				}
			}) satisfies LessonQuestionMap)
		}
	} catch (error) {
		console.error(error)
		throw error
	}
}
