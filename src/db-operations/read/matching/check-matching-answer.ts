import { isNull } from "lodash"
import { QuestionUUID } from "@lever-labs/common-ts/types/utils"
import PrismaClientClass from "../../../classes/prisma-client"

export default async function checkMatchingAnswer(
	questionId: QuestionUUID,
	codingBlockId: number,
	matchingAnswerChoiceTextId: number
): Promise<boolean> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const doesPairExist = await prismaClient.matching_answer_choice_pair.findFirst({
			where: {
				matching_question_id: questionId,
				coding_block_id: codingBlockId,
				matching_answer_choice_text_id: matchingAnswerChoiceTextId
			},
			select: {
				matching_answer_choice_pair_id: true
			}
		})

		return !isNull(doesPairExist)
	} catch (error) {
		console.error(error)
		throw error
	}
}
