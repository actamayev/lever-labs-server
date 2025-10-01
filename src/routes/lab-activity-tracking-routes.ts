import express from "express"

import attachReadingBlockIdFromReadingName from "../middleware/attach/attach-reading-block-id-from-reading-name"
import validateSubmitQuizAnswer from "../middleware/request-validation/lab-lesson-tracking/validate-submit-quiz-answer"
import validateActivityIdInParams from "../middleware/request-validation/lab-lesson-tracking/validate-activity-id-in-params"
import validateReadingBlockNameInParams from "../middleware/request-validation/lab-lesson-tracking/validate-reading-block-name-in-params"

import submitQuizAnswer from "../controllers/lab-activity-tracking/submit-quiz-answer"
import retrieveQuizAttempts from "../controllers/lab-activity-tracking/retrieve-quiz-attempts"
import markActivityComplete from "../controllers/lab-activity-tracking/mark-activity-complete"
import markReadingBlockComplete from "../controllers/lab-activity-tracking/mark-reading-block-complete"
import retrieveUserActivityProgress from "../controllers/lab-activity-tracking/retrieve-user-activity-progress"
import retrieveCompletedReadingBlocks from "../controllers/lab-activity-tracking/retrieve-completed-reading-blocks"
import validateReadingUUIDInParams from "../middleware/request-validation/lab-lesson-tracking/validate-reading-uuid-in-params"

const labActivityTrackingRoutes = express.Router()

labActivityTrackingRoutes.get("/retrieve-user-activity-progress", retrieveUserActivityProgress)

labActivityTrackingRoutes.get(
	"/retrieve-quiz-attempts/:activityId",
	validateActivityIdInParams,
	retrieveQuizAttempts
)

labActivityTrackingRoutes.post(
	"/mark-activity-complete/:activityId",
	validateActivityIdInParams,
	markActivityComplete
)

labActivityTrackingRoutes.post(
	"/submit-quiz-answer/:readingQuestionAnswerChoiceId",
	validateSubmitQuizAnswer,
	submitQuizAnswer
)

labActivityTrackingRoutes.post(
	"/mark-reading-block-complete/:readingBlockName",
	validateReadingBlockNameInParams,
	attachReadingBlockIdFromReadingName,
	markReadingBlockComplete
)

labActivityTrackingRoutes.get(
	"/retrieve-completed-reading-blocks/:readingUUID",
	validateReadingUUIDInParams,
	retrieveCompletedReadingBlocks
)

export default labActivityTrackingRoutes
