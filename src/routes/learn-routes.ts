import express from "express"
import validateLessonId from "../middleware/request-validation/learn/validate-lesson-id"
import validateBlockToFunctionAnswer from "../middleware/request-validation/learn/validate-block-to-function-answer"
import validateFunctionToBlockAnswer from "../middleware/request-validation/learn/validate-function-to-block-answer"
import validateFillInTheBlankAnswer from "../middleware/request-validation/learn/validate-fill-in-the-blank-answer"

import getAllLessons from "../controllers/learn/get-all-lessons"
import getDetailedLesson from "../controllers/learn/get-detailed-lesson"
import markLessonComplete from "../controllers/learn/mark-lesson-complete"
import submitBlockToFunctionAnswer from "../controllers/learn/submit-block-to-function-answer"
import submitFillInTheBlankAnswer from "../controllers/learn/submit-fill-in-the-blank-answer"
import submitFunctionToBlockAnswer from "../controllers/learn/submit-function-to-block-answer"

const learnRoutes = express.Router()

learnRoutes.get("/get-all-lessons", getAllLessons)

learnRoutes.get("/get-detailed-lesson/:lessonId", validateLessonId, getDetailedLesson)

learnRoutes.post("/mark-lesson-complete/:lessonId", validateLessonId, markLessonComplete)

learnRoutes.post(
	"/submit-block-to-function/:lessonId",
	validateLessonId,
	validateBlockToFunctionAnswer,
	submitBlockToFunctionAnswer
)

learnRoutes.post(
	"/submit-function-to-block/:lessonId",
	validateLessonId,
	validateFunctionToBlockAnswer,
	submitFunctionToBlockAnswer
)

// TODO: For simple questions, we can just submit the answer choice id.
// For more complex questions, we need to submit the full answer to the LLM
learnRoutes.post(
	"/submit-fill-in-the-blank/:lessonId",
	validateLessonId,
	validateFillInTheBlankAnswer,
	submitFillInTheBlankAnswer
)

export default learnRoutes
