import PrismaClientClass from "../../../classes/prisma-client"

// eslint-disable-next-line max-lines-per-function
export default async function retrieveQuestionsFromActivity(userId: number, activityUUID: ActivityUUID): Promise<RetrievedQuestions[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const retrievedQuestionsFromActivity = await prismaClient.activity.findMany({
			where: {
				activity_uuid: activityUUID
			},
			select: {
				reading_questions: {
					select: {
						question_text: true,
						reading_question_id: true,
						reading_question_answer_choice: {
							select: {
								answer_text: true,
								is_correct: true,
								explanation: true,
								user_answers: {
									where: {
										user_id: userId
									},
									select: {
										reading_question_answer_choice_id: true,
									}
								}
							}
						}
					}
				}
			}
		})

		return retrievedQuestionsFromActivity.flatMap(activity =>
			activity.reading_questions.map(question => ({
				questionText: question.question_text,
				readingQuestionId: question.reading_question_id,
				questionAnswerChoices: question.reading_question_answer_choice.map(choice => ({
					answerText: choice.answer_text,
					isCorrect: choice.is_correct,
					explanation: choice.explanation,
					didUserSelectAnswer: choice.user_answers.length > 0
				}))
			}))
		)
	} catch (error) {
		console.error(error)
		throw error
	}
}
