import { RetrievedQuestions, QuestionUUID } from "@bluedotrobots/common-ts/types/lab"
import PrismaClientClass from "../../../classes/prisma-client"

// eslint-disable-next-line max-lines-per-function
export default async function retrieveQuestionsFromActivity(userId: number, activityId: number): Promise<RetrievedQuestions[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const retrievedQuestions = await prismaClient.reading_question.findMany({
			where: {
				activity_id: activityId
			},
			select: {
				question_text: true,
				reading_question_id: true,
				reading_question_uuid: true,
				reading_question_answer_choice: {
					select: {
						answer_text: true,
						is_correct: true,
						explanation: true,
						user_answer: {
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
		})

		return retrievedQuestions.map(question => ({
			questionText: question.question_text,
			readingQuestionId: question.reading_question_id,
			readingQuestionUUID: question.reading_question_uuid as QuestionUUID,
			questionAnswerChoices: question.reading_question_answer_choice.map(choice => ({
				answerText: choice.answer_text,
				isCorrect: choice.is_correct,
				explanation: choice.explanation,
				didUserSelectAnswer: choice.user_answer.length > 0
			}))
		}) satisfies RetrievedQuestions)
	} catch (error) {
		console.error(error)
		throw error
	}
}
