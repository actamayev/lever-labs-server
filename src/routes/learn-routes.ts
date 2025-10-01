import express from "express"
import attachLessonIdFromUuid from "../middleware/attach/attach-lesson-id-from-uuid"
import validateBlockToFunctionAnswer from "../middleware/request-validation/learn/validate-block-to-function-answer"
import validateFunctionToBlockAnswer from "../middleware/request-validation/learn/validate-function-to-block-answer"
import validateFillInTheBlankAnswer from "../middleware/request-validation/learn/validate-fill-in-the-blank-answer"

import getAllLessons from "../controllers/learn/get-all-lessons"
import getSingleLesson from "../controllers/learn/get-single-lesson"
import markLessonComplete from "../controllers/learn/mark-lesson-complete"
import submitBlockToFunctionAnswer from "../controllers/learn/submit-block-to-function-answer"
import submitFillInTheBlankAnswer from "../controllers/learn/submit-fill-in-the-blank-answer"
import submitFunctionToBlockAnswer from "../controllers/learn/submit-function-to-block-answer"

const learnRoutes = express.Router()

learnRoutes.get("/get-all-lessons", getAllLessons)

learnRoutes.get("/get-single-lesson/:lessonUUID", attachLessonIdFromUuid, getSingleLesson)

learnRoutes.post("/mark-lesson-complete/:lessonUUID", attachLessonIdFromUuid, markLessonComplete)

learnRoutes.post(
	"/submit-block-to-function/:lessonUUID",
	attachLessonIdFromUuid,
	validateBlockToFunctionAnswer,
	submitBlockToFunctionAnswer
)

learnRoutes.post(
	"/submit-function-to-block/:lessonUUID",
	attachLessonIdFromUuid,
	validateFunctionToBlockAnswer,
	submitFunctionToBlockAnswer
)

learnRoutes.post(
	"/submit-fill-in-the-blank/:lessonUUID",
	attachLessonIdFromUuid,
	validateFillInTheBlankAnswer,
	submitFillInTheBlankAnswer
)

export default learnRoutes
