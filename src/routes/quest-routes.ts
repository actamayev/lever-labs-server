import express from "express"
import validateLessonId from "../middleware/request-validation/quest/validate-lesson-id"
import validateQuestionId from "../middleware/request-validation/quest/validate-question-id"
import validateUserCode from "../middleware/request-validation/quest/validate-user-code"
import validateBlockToFunctionAnswer from "../middleware/request-validation/quest/validate-block-to-function-answer"
import validateFunctionToBlockAnswer from "../middleware/request-validation/quest/validate-function-to-block-answer"
import validateActionToCodeMultipleChoiceAnswer from "../middleware/request-validation/quest/validate-action-to-code-multiple-choice-answer"
import validateMatchingAnswer from "../middleware/request-validation/quest/validate-matching-answer"

import getAllLessons from "../controllers/quest/get-all-lessons"
import getDetailedLesson from "../controllers/quest/get-detailed-lesson"
import markLessonComplete from "../controllers/quest/mark-lesson-complete"
import submitBlockToFunctionAnswer from "../controllers/quest/submit-block-to-function-answer"
import submitFillInTheBlankAnswer from "../controllers/quest/submit-fill-in-the-blank-answer"
import submitFunctionToBlockAnswer from "../controllers/quest/submit-function-to-block-answer"
import submitActionToCodeMultipleChoiceAnswer from "../controllers/quest/submit-action-to-code-multiple-choice"
import submitOpenEndedActionToCodeQuestion from "../controllers/quest/submit-open-ended-action-to-code-question"
import submitMatchingAnswer from "../controllers/quest/submit-matching-answer"

const questRoutes = express.Router()

questRoutes.get("/get-all-lessons", getAllLessons)

questRoutes.get("/get-detailed-lesson/:lessonId", validateLessonId, getDetailedLesson)

questRoutes.post("/mark-lesson-complete/:lessonId", validateLessonId, markLessonComplete)

questRoutes.post(
	"/submit-block-to-function/:questionId",
	validateQuestionId,
	validateBlockToFunctionAnswer,
	submitBlockToFunctionAnswer
)

questRoutes.post(
	"/submit-function-to-block/:questionId",
	validateQuestionId,
	validateFunctionToBlockAnswer,
	submitFunctionToBlockAnswer
)

questRoutes.post(
	"/submit-fill-in-the-blank/:questionId",
	validateQuestionId,
	validateUserCode,
	submitFillInTheBlankAnswer
)

questRoutes.post(
	"/submit-action-to-code-multiple-choice/:questionId",
	validateQuestionId,
	validateActionToCodeMultipleChoiceAnswer,
	submitActionToCodeMultipleChoiceAnswer
)

questRoutes.post(
	"/submit-action-to-code-open-ended/:questionId",
	validateQuestionId,
	validateUserCode,
	submitOpenEndedActionToCodeQuestion
)

questRoutes.post(
	"/submit-matching-answer/:questionId",
	validateQuestionId,
	validateMatchingAnswer,
	submitMatchingAnswer
)

export default questRoutes
