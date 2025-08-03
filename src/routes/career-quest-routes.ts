import express from "express"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import attachCareerIdFromUUID from "../middleware/attach/attach-career-id-from-uuid"
import attachChallengeIdFromUUID from "../middleware/attach/attach-challenge-id-from-uuid"
import validateCqUUID from "../middleware/request-validation/career-quest/validate-cq-uuid"
import validateEditSandboxProject from "../middleware/request-validation/sandbox/validate-edit-sandbox-project"

import editCareerQuestSandboxProject from "../controllers/career-quest/edit-career-quest-sandbox-project"
import retrieveCareerQuestChallengeData from "../controllers/career-quest/retrieve-career-quest-challenge-data"
import updateCareerQuestUserProgress from "../controllers/career-quest/update-career-quest-user-progress"
import markChallengeAsSeen from "../controllers/career-quest/mark-challenge-as-seen"

const careerQuestRoutes = express.Router()

careerQuestRoutes.post(
	"/edit-career-quest-sandbox-project/:challengeUUID",
	validateEditSandboxProject,
	jwtVerifyAttachUserId,
	attachChallengeIdFromUUID,
	editCareerQuestSandboxProject
)

careerQuestRoutes.get(
	"/get-career-quest-challenge-data/:careerUUID",
	jwtVerifyAttachUserId,
	attachCareerIdFromUUID,
	retrieveCareerQuestChallengeData
)

careerQuestRoutes.post(
	"/update-career-quest-user-progress",
	jwtVerifyAttachUserId,
	validateCqUUID,
	updateCareerQuestUserProgress
)

careerQuestRoutes.post(
	"/mark-challenge-as-seen/:challengeUUID",
	jwtVerifyAttachUserId,
	attachChallengeIdFromUUID,
	markChallengeAsSeen
)

export default careerQuestRoutes
