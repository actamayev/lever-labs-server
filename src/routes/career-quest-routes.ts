import express from "express"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import attachChallengeIdFromUUID from "../middleware/attach/attach-challenge-id-from-uuid"
import validateEditSandboxProject from "../middleware/request-validation/sandbox/validate-edit-sandbox-project"

import editCareerQuestSandboxProject from "../controllers/career-quest/edit-career-quest-sandbox-project"
import retrieveCareerQuestChallengeData from "../controllers/career-quest/retrieve-career-quest-challenge-data"

const careerQuestRoutes = express.Router()

careerQuestRoutes.post(
	"/edit-career-quest-sandbox-project/:challengeUUID",
	validateEditSandboxProject,
	jwtVerifyAttachUserId,
	attachChallengeIdFromUUID,
	editCareerQuestSandboxProject
)

careerQuestRoutes.get(
	"/get-career-quest-challenge-data/:challengeUUID",
	jwtVerifyAttachUserId,
	attachChallengeIdFromUUID,
	retrieveCareerQuestChallengeData
)

export default careerQuestRoutes
