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
				lesson_order: true,
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
								},
								action_to_code_multiple_choice_question: {
									select: {
										question_text: true,
										reference_solution_cpp: true,
										action_to_code_multiple_choice_answer_choice: {
											select: {
												action_to_code_multiple_choice_answer_choice_id: true,
												is_correct: true,
												coding_block: {
													select: {
														coding_block_id: true,
														coding_block_json: true
													}
												}
											},
											orderBy: {
												action_to_code_multiple_choice_answer_choice_id: "asc"
											}
										}
									}
								},
								action_to_code_open_ended_question: {
									select: {
										question_text: true,
										initial_blockly_json: true,
										reference_solution_cpp: true,
										action_to_code_open_ended_question_block_bank: {
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
								},
								matching_question: {
									select: {
										question_text: true,
										matching_answer_choice_pair: {
											select: {
												matching_answer_choice_pair_id: true,
												coding_block: {
													select: {
														coding_block_id: true,
														coding_block_json: true
													}
												},
												matching_answer_choice_text: {
													select: {
														matching_answer_choice_text_id: true,
														answer_choice_text: true
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
			lessonOrder: lesson.lesson_order as number,
			isCompleted: !isEmpty(lesson.completed_user_lesson),
			// eslint-disable-next-line max-lines-per-function
			lessonQuestionMap: lesson.lesson_question_map.map(map => ({
				lessonQuestionMapId: map.lesson_question_map_id,
				order: map.order,
				question: {
					questionId: map.question.question_id as QuestionUUID,
					questionType: map.question.question_type,
					blockToFunctionFlashcard: map.question.block_to_function_flashcard ? {
						questionText: map.question.block_to_function_flashcard.question_text,
						codingBlock: {
							codingBlockId: map.question.block_to_function_flashcard.coding_block.coding_block_id,
							codingBlockJson: map.question.block_to_function_flashcard.coding_block.coding_block_json as BlocklyJson,
						},

						blockToFunctionAnswerChoice: map.question.block_to_function_flashcard.block_to_function_answer_choice
							.sort(() => Math.random() - 0.5) // Randomize the order server-side
							.map((choice, index) => ({
								blockToFunctionAnswerChoiceId: choice.block_to_function_answer_choice_id,
								order: index, // Randomized display order
								functionDescriptionText: choice.function_description_text,
							}))
					} : null,
					functionToBlockFlashcard: map.question.function_to_block_flashcard ? {
						questionText: map.question.function_to_block_flashcard.question_text,
						functionToBlockAnswerChoice: map.question.function_to_block_flashcard.function_to_block_answer_choice
							.sort(() => Math.random() - 0.5) // Randomize the order server-side
							.map((choice, index) => ({
								functionToBlockAnswerChoiceId: choice.function_to_block_answer_choice_id,
								order: index, // Randomized display order
								codingBlock: {
									codingBlockId: choice.coding_block.coding_block_id,
									codingBlockJson: choice.coding_block.coding_block_json as BlocklyJson,
								}
							}))
					} : null,
					fillInTheBlank: map.question.fill_in_the_blank ? {
						questionText: map.question.fill_in_the_blank.question_text,
						initialBlocklyJson: map.question.fill_in_the_blank.initial_blockly_json as BlocklyJson,
						availableBlocks: map.question.fill_in_the_blank.fill_in_the_blank_block_bank.map(bank => ({
							blockNameId: bank.block_name.block_name_id,
							blockName: bank.block_name.block_name as BlockNames,
						}))
					} : null,
					actionToCodeMultipleChoice: map.question.action_to_code_multiple_choice_question ? {
						questionText: map.question.action_to_code_multiple_choice_question.question_text,
						referenceSolutionCpp: map.question.action_to_code_multiple_choice_question.reference_solution_cpp,
						// eslint-disable-next-line max-len
						actionToCodeMultipleChoiceAnswerChoice: map.question.action_to_code_multiple_choice_question.action_to_code_multiple_choice_answer_choice
							.sort(() => Math.random() - 0.5) // Randomize the order server-side
							.map((choice, index) => ({
								actionToCodeMultipleChoiceAnswerChoiceId: choice.action_to_code_multiple_choice_answer_choice_id,
								order: index, // Randomized display order
								codingBlock: {
									codingBlockId: choice.coding_block.coding_block_id,
									codingBlockJson: choice.coding_block.coding_block_json as BlocklyJson,
								}
							}))
					} : null,
					actionToCodeOpenEnded: map.question.action_to_code_open_ended_question ? {
						questionText: map.question.action_to_code_open_ended_question.question_text,
						initialBlocklyJson: map.question.action_to_code_open_ended_question.initial_blockly_json as BlocklyJson,
						referenceSolutionCpp: map.question.action_to_code_open_ended_question.reference_solution_cpp,
						// eslint-disable-next-line max-len
						availableBlocks: map.question.action_to_code_open_ended_question.action_to_code_open_ended_question_block_bank.map(bank => ({
							blockNameId: bank.block_name.block_name_id,
							blockName: bank.block_name.block_name as BlockNames,
						}))
					} : null,
					matching: map.question.matching_question ? {
						questionText: map.question.matching_question.question_text,
						matchingAnswerChoice: map.question.matching_question.matching_answer_choice_pair
							.map((pair, index) => ({
								matchingAnswerChoicePairId: pair.matching_answer_choice_pair_id,
								order: index, // Randomized display order
								matchingAnswerChoiceText: {
									matchingAnswerChoiceTextId: pair.matching_answer_choice_text.matching_answer_choice_text_id,
									answerChoiceText: pair.matching_answer_choice_text.answer_choice_text
								},
								codingBlock: {
									codingBlockId: pair.coding_block.coding_block_id,
									codingBlockJson: pair.coding_block.coding_block_json as BlocklyJson,
								}
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
