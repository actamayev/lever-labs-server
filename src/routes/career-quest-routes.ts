import express from "express"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import attachCareerIdFromUUID from "../middleware/attach/attach-career-id-from-uuid"
import attachChallengeIdFromUUID from "../middleware/attach/attach-challenge-id-from-uuid"
import validateCqUserProgress from "../middleware/request-validation/career-quest/validate-user-progress"
import validateEditSandboxProject from "../middleware/request-validation/sandbox/validate-edit-sandbox-project"

import markChallengeAsSeen from "../controllers/career-quest/mark-challenge-as-seen"
import retrieveCareerChallengeData from "../controllers/career-quest/retrieve-career-challenge-data"
import editChallengeSandboxProject from "../controllers/career-quest/edit-challenge-sandbox-project"
import updateCareerQuestUserProgress from "../controllers/career-quest/update-career-quest-user-progress"

const careerQuestRoutes = express.Router()

careerQuestRoutes.post(
	"/edit-challenge-sandbox-project/:challengeUUID",
	validateEditSandboxProject,
	jwtVerifyAttachUserId,
	attachChallengeIdFromUUID,
	editChallengeSandboxProject
)

careerQuestRoutes.get(
	"/get-career-challenge-data/:careerUUID",
	jwtVerifyAttachUserId,
	attachCareerIdFromUUID,
	retrieveCareerChallengeData
)

careerQuestRoutes.post(
	"/update-career-quest-user-progress",
	jwtVerifyAttachUserId,
	validateCqUserProgress,
	updateCareerQuestUserProgress
)

careerQuestRoutes.post(
	"/mark-challenge-as-seen/:challengeUUID",
	jwtVerifyAttachUserId,
	attachChallengeIdFromUUID,
	markChallengeAsSeen
)

export default careerQuestRoutes
