import PrismaClientClass from "../../../classes/prisma-client"

// eslint-disable-next-line max-lines-per-function
export default async function getFunctionToBlockQuestionsDb(lessonId: number): Promise<GetFunctionToBlockQuestionsDbReturn[]> {
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
				functionToBlockFlashcard: q.question.function_to_block_flashcard ? {
					functionToBlockAnswerChoice: q.question.function_to_block_flashcard.function_to_block_answer_choice.map(choice => ({
						functionToBlockAnswerChoiceId: choice.function_to_block_answer_choice_id,
						order: choice.order,
						codingBlockId: choice.coding_block_id,
						isCorrect: choice.is_correct
					}))
				} : null
			}
		}) satisfies GetFunctionToBlockQuestionsDbReturn)
	} catch (error) {
		console.error(error)
		throw error
	}
}
