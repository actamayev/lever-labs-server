import PrismaClientClass from "../../../classes/prisma-client"

// eslint-disable-next-line max-lines-per-function
export default async function getFillInTheBlankQuestionsDb(lessonId: number): Promise<GetFillInTheBlankQuestionsDbReturn[]> {
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
		})

		return questions.map(q => ({
			lessonQuestionMapId: q.lesson_question_map_id,
			order: q.order,
			question: {
				questionId: q.question.question_id,
				questionType: q.question.question_type,
				fillInTheBlank: q.question.fill_in_the_blank ? {
					fillInTheBlankBlockBank: q.question.fill_in_the_blank.fill_in_the_blank_block_bank.map(bank => ({
						fillInTheBlankBlockBankId: bank.fill_in_the_blank_block_bank_id,
						order: bank.order,
						codingBlockId: bank.coding_block_id,
						quantity: bank.quantity
					}))
				} : null
			}
		}) satisfies GetFillInTheBlankQuestionsDbReturn)
	} catch (error) {
		console.error(error)
		throw error
	}
}
