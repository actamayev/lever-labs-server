import express from "express"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import attachActivityIdFromUUID from "../middleware/attach/attach-activity-id-from-uuid"
import validateSubmitQuizAnswer from "../middleware/request-validation/lab-lesson-tracking/validate-submit-quiz-answer"
import validateActivityUUIDInParams from "../middleware/request-validation/lab-lesson-tracking/validate-activity-uuid-in-params"

import submitQuizAnswer from "../controllers/lab-activity-tracking/submit-quiz-answer"
import retrieveQuizAttempts from "../controllers/lab-activity-tracking/retrieve-quiz-attempts"
import markActivityComplete from "../controllers/lab-activity-tracking/mark-activity-complete"
import retrieveUserActivityProgress from "../controllers/lab-activity-tracking/retrieve-user-activity-progress"

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

export default labActivityTrackingRoutes
