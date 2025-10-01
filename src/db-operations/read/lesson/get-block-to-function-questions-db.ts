import PrismaClientClass from "../../../classes/prisma-client"

// eslint-disable-next-line max-lines-per-function
export default async function getBlockToFunctionQuestionsDb(lessonId: number): Promise<GetBlockToFunctionQuestionsDbReturn[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const questions = await prismaClient.lesson_question_map.findMany({
			where: {
				lesson_id: lessonId
			},
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
						}
					}
				}
			},
			orderBy: {
				order: "asc"
			}
		})

		return questions.map(q => ({
			lessonQuestionMapId: q.lesson_question_map_id,
			order: q.order,
			question: {
				questionId: q.question.question_id,
				questionType: q.question.question_type,
				blockToFunctionFlashcard: q.question.block_to_function_flashcard ? {
					codingBlockId: q.question.block_to_function_flashcard.coding_block_id,
					blockToFunctionAnswerChoice: q.question.block_to_function_flashcard.block_to_function_answer_choice.map(choice => ({
						blockToFunctionAnswerChoiceId: choice.block_to_function_answer_choice_id,
						order: choice.order,
						functionDescriptionText: choice.function_description_text,
						isCorrect: choice.is_correct
					}))
				} : null
			}
		}) satisfies GetBlockToFunctionQuestionsDbReturn)
	} catch (error) {
		console.error(error)
		throw error
	}
}
