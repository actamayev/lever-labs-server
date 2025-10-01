import express from "express"
import attachLessonIdFromUuid from "../middleware/attach/attach-lesson-id-from-uuid"
import validateBlockToFunctionAnswer from "../middleware/request-validation/learn/validate-block-to-function-answer"
import validateFunctionToBlockAnswer from "../middleware/request-validation/learn/validate-function-to-block-answer"
import validateFillInTheBlankAnswer from "../middleware/request-validation/learn/validate-fill-in-the-blank-answer"

import getAllLessons from "../controllers/learn/get-all-lessons"
import getSingleLesson from "../controllers/learn/get-single-lesson"
import markLessonComplete from "../controllers/learn/mark-lesson-complete"
import getBlockToFunctionQuestions from "../controllers/learn/get-block-to-function-questions"
import getFillInTheBlankQuestions from "../controllers/learn/get-fill-in-the-blank-questions"
import getFunctionToBlockQuestions from "../controllers/learn/get-function-to-block-questions"

const learnRoutes = express.Router()

learnRoutes.get("/get-all-lessons", getAllLessons)

learnRoutes.get("/get-single-lesson/:lessonUuid", attachLessonIdFromUuid, getSingleLesson)

learnRoutes.post("/mark-lesson-complete/:lessonUuid", attachLessonIdFromUuid, markLessonComplete)

learnRoutes.post(
	"/questions/block-to-function/:lessonUuid",
	attachLessonIdFromUuid,
	validateBlockToFunctionAnswer,
	getBlockToFunctionQuestions
)

learnRoutes.post(
	"/questions/function-to-block/:lessonUuid",
	attachLessonIdFromUuid,
	validateFunctionToBlockAnswer,
	getFunctionToBlockQuestions
)

learnRoutes.post(
	"/questions/fill-in-the-blank/:lessonUuid",
	attachLessonIdFromUuid,
	validateFillInTheBlankAnswer,
	getFillInTheBlankQuestions
)

export default learnRoutes
