import express from "express"
import validateLessonId from "../middleware/request-validation/learn/validate-lesson-id"
import validateQuestionId from "../middleware/request-validation/learn/validate-question-id"
import validateFillInTheBlankCode from "../middleware/request-validation/learn/validate-fill-in-the-blank-code"
import validateBlockToFunctionAnswer from "../middleware/request-validation/learn/validate-block-to-function-answer"
import validateFunctionToBlockAnswer from "../middleware/request-validation/learn/validate-function-to-block-answer"
import validateOpenEndedActionToCode from "../middleware/request-validation/learn/validate-open-ended-action-to-code"
import validateActionToCodeMultipleChoiceAnswer from "../middleware/request-validation/learn/validate-action-to-code-multiple-choice-answer"

import getAllLessons from "../controllers/learn/get-all-lessons"
import getDetailedLesson from "../controllers/learn/get-detailed-lesson"
import markLessonComplete from "../controllers/learn/mark-lesson-complete"
import submitBlockToFunctionAnswer from "../controllers/learn/submit-block-to-function-answer"
import submitFillInTheBlankAnswer from "../controllers/learn/submit-fill-in-the-blank-answer"
import submitFunctionToBlockAnswer from "../controllers/learn/submit-function-to-block-answer"
import submitActionToCodeMultipleChoiceAnswer from "../controllers/learn/submit-action-to-code-multiple-choice"
import submitOpenEndedActionToCodeQuestion from "../controllers/learn/submit-open-ended-action-to-code-question"

const learnRoutes = express.Router()

learnRoutes.get("/get-all-lessons", getAllLessons)

learnRoutes.get("/get-detailed-lesson/:lessonId", validateLessonId, getDetailedLesson)

learnRoutes.post("/mark-lesson-complete/:lessonId", validateLessonId, markLessonComplete)

learnRoutes.post(
	"/submit-block-to-function/:questionId",
	validateQuestionId,
	validateBlockToFunctionAnswer,
	submitBlockToFunctionAnswer
)

learnRoutes.post(
	"/submit-function-to-block/:questionId",
	validateQuestionId,
	validateFunctionToBlockAnswer,
	submitFunctionToBlockAnswer
)

learnRoutes.post(
	"/submit-fill-in-the-blank/:questionId",
	validateQuestionId,
	validateFillInTheBlankCode,
	submitFillInTheBlankAnswer
)

learnRoutes.post(
	"/submit-action-to-code-multiple-choice/:questionId",
	validateQuestionId,
	validateActionToCodeMultipleChoiceAnswer,
	submitActionToCodeMultipleChoiceAnswer
)

learnRoutes.post(
	"/submit-action-to-code-open-ended/:questionId",
	validateQuestionId,
	validateOpenEndedActionToCode,
	submitOpenEndedActionToCodeQuestion
)

export default learnRoutes
