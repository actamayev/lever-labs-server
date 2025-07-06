import express from "express"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validateEditCareerQuestSandboxProject
	from "../middleware/request-validation/career-quest/validate-edit-career-quest-sandbox-project"
import validateChallengeIdInParams from "../middleware/request-validation/chat/validate-challenge-id-in-params"

import editCareerQuestSandboxProject from "../controllers/career-quest/edit-career-quest-sandbox-project"
import retrieveCareerQuestChallengeData from "../controllers/career-quest/retrieve-career-quest-challenge-data"

const careerQuestRoutes = express.Router()

careerQuestRoutes.post(
	"/edit-career-quest-sandbox-project/:challengeId",
	validateChallengeIdInParams,
	validateEditCareerQuestSandboxProject,
	jwtVerifyAttachUserId,
	editCareerQuestSandboxProject
)

careerQuestRoutes.get(
	"/get-career-quest-challenge-data/:challengeId",
	validateChallengeIdInParams,
	jwtVerifyAttachUserId,
	retrieveCareerQuestChallengeData
)

export default careerQuestRoutes
