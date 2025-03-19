import express from "express"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import attachActivityIdFromUUID from "../middleware/attach/attach-activity-id-from-uuid"
import attachReadingBlockIdFromReadingName from "../middleware/attach/attach-reading-block-id-from-reading-name"
import validateSubmitQuizAnswer from "../middleware/request-validation/lab-lesson-tracking/validate-submit-quiz-answer"
import validateActivityUUIDInParams from "../middleware/request-validation/lab-lesson-tracking/validate-activity-uuid-in-params"
import validateReadingBlockNameInParams from "../middleware/request-validation/lab-lesson-tracking/validate-reading-block-name-in-params"

import submitQuizAnswer from "../controllers/lab-activity-tracking/submit-quiz-answer"
import retrieveQuizAttempts from "../controllers/lab-activity-tracking/retrieve-quiz-attempts"
import markActivityComplete from "../controllers/lab-activity-tracking/mark-activity-complete"
import markReadingBlockComplete from "../controllers/lab-activity-tracking/mark-reading-block-complete"
import retrieveUserActivityProgress from "../controllers/lab-activity-tracking/retrieve-user-activity-progress"
import validateReadingUUIDInParams from "../middleware/request-validation/lab-lesson-tracking/validate-reading-uuid-in-params"
import retrieveCompletedReadingBlocks from "../controllers/lab-activity-tracking/retrieve-completed-reading-blocks"

const labActivityTrackingRoutes = express.Router()

labActivityTrackingRoutes.get("/retrieve-user-activity-progress", jwtVerifyAttachUserId, retrieveUserActivityProgress)

labActivityTrackingRoutes.get(
	"/retrieve-quiz-attempts/:activityUUID",
	validateActivityUUIDInParams,
	jwtVerifyAttachUserId,
	attachActivityIdFromUUID,
	retrieveQuizAttempts
)

labActivityTrackingRoutes.post(
	"/mark-activity-complete/:activityUUID",
	validateActivityUUIDInParams,
	jwtVerifyAttachUserId,
	attachActivityIdFromUUID,
	markActivityComplete
)

labActivityTrackingRoutes.post(
	"/submit-quiz-answer/:readingQuestionAnswerChoiceId",
	validateSubmitQuizAnswer,
	jwtVerifyAttachUserId,
	submitQuizAnswer
)

labActivityTrackingRoutes.post(
	"/mark-reading-block-complete/:readingBlockName",
	validateReadingBlockNameInParams,
	jwtVerifyAttachUserId,
	attachReadingBlockIdFromReadingName,
	markReadingBlockComplete
)

labActivityTrackingRoutes.get(
	"/retrieve-completed-reading-blocks/:readingUUID",
	validateReadingUUIDInParams,
	jwtVerifyAttachUserId,
	attachActivityIdFromUUID,
	retrieveCompletedReadingBlocks
)

export default labActivityTrackingRoutes
