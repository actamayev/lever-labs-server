import { isEmpty } from "lodash"
import { DetailedLesson, LessonQuestionMap } from "@lever-labs/common-ts/types/learn"
import PrismaClientClass from "../../../classes/prisma-client"
import { QuestionUUID, LessonUUID } from "@lever-labs/common-ts/types/utils"
import { BlockNames } from "@lever-labs/common-ts/types/blockly/blockly"
import { BlocklyJson } from "@lever-labs/common-ts/types/sandbox"

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
										question_text: true,
										block_to_function_answer_choice: {
											select: {
												block_to_function_answer_choice_id: true,
												order: true,
												function_description_text: true,
												is_correct: true
											}
										},
										coding_block: {
											select: {
												coding_block_id: true,
												coding_block_json: true
											}
										}
									}
								},
								function_to_block_flashcard: {
									select: {
										question_text: true,
										function_to_block_answer_choice: {
											select: {
												function_to_block_answer_choice_id: true,
												order: true,
												is_correct: true,
												coding_block: {
													select: {
														coding_block_id: true,
														coding_block_json: true
													}
												}
											}
										}
									}
								},
								fill_in_the_blank: {
									select: {
										question_text: true,
										initial_blockly_json: true,
										fill_in_the_blank_block_bank: {
											select: {
												block_name: {
													select: {
														block_name_id: true,
														block_name: true
													}
												}
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
			// eslint-disable-next-line max-lines-per-function
			lessonQuestionMap: lesson.lesson_question_map.map(map => ({
				lessonQuestionMapId: map.lesson_question_map_id,
				order: map.order,
				question: {
					questionId: map.question.question_id as QuestionUUID,
					questionType: map.question.question_type,
					blockToFunctionFlashcard: map.question.block_to_function_flashcard ? {
						codingBlock: {
							codingBlockId: map.question.block_to_function_flashcard.coding_block.coding_block_id,
							// eslint-disable-next-line max-len
							codingBlockJson: JSON.stringify(map.question.block_to_function_flashcard.coding_block.coding_block_json) as unknown as BlocklyJson,
						},
						// eslint-disable-next-line max-len
						blockToFunctionAnswerChoice: map.question.block_to_function_flashcard.block_to_function_answer_choice.map(choice => ({
							blockToFunctionAnswerChoiceId: choice.block_to_function_answer_choice_id,
							order: choice.order,
							functionDescriptionText: choice.function_description_text,
							isCorrect: choice.is_correct
						})),
						questionText: map.question.block_to_function_flashcard.question_text
					} : null,
					functionToBlockFlashcard: map.question.function_to_block_flashcard ? {
						questionText: map.question.function_to_block_flashcard.question_text,
						// eslint-disable-next-line max-len
						functionToBlockAnswerChoice: map.question.function_to_block_flashcard.function_to_block_answer_choice.map(choice => ({
							functionToBlockAnswerChoiceId: choice.function_to_block_answer_choice_id,
							order: choice.order,
							codingBlock: {
								codingBlockId: choice.coding_block.coding_block_id,
								codingBlockJson: choice.coding_block.coding_block_json as BlocklyJson,
							},
							isCorrect: choice.is_correct
						}))
					} : null,
					fillInTheBlank: map.question.fill_in_the_blank ? {
						questionText: map.question.fill_in_the_blank.question_text,
						initialBlocklyJson: JSON.stringify(map.question.fill_in_the_blank.initial_blockly_json) as unknown as BlocklyJson,
						availableBlocks: map.question.fill_in_the_blank.fill_in_the_blank_block_bank.map(bank => ({
							blockNameId: bank.block_name.block_name_id,
							blockName: bank.block_name.block_name as BlockNames,
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
