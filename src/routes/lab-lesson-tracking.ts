import express from "express"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import retrieveUserActivityProgress from "../controllers/lab-activity-tracking/retrieve-user-activity-progress"
import retrieveQuizAttempts from "../controllers/lab-activity-tracking/retrieve-quiz-attempts"
import validateRetrieveQuizAttempts from "../middleware/request-validation/lab-lesson-tracking/validate-retrieve-quiz-attempts"

const labActivityTrackingRoutes = express.Router()

labActivityTrackingRoutes.post(
	"/retrieve-user-activity-progress",
	jwtVerifyAttachUserId,
	retrieveUserActivityProgress
)

labActivityTrackingRoutes.post(
	"/retrieve-quiz-attempts",
	validateRetrieveQuizAttempts,
	jwtVerifyAttachUserId,
	retrieveQuizAttempts
)

export default labActivityTrackingRoutes
