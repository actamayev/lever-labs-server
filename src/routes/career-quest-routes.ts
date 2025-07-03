import express from "express"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validateEditCareerQuestSandboxProject
	from "../middleware/request-validation/career-quest/validate-edit-career-quest-sandbox-project"
import validateChallengeIdInParams from "../middleware/request-validation/chat/validate-challenge-id-in-params"

import editCareerQuestSandboxProject from "../controllers/career-quest/edit-career-quest-sandbox-project"

const careerQuestRoutes = express.Router()

careerQuestRoutes.post(
	"/edit-career-quest-sandbox-project/:challengeId",
	validateChallengeIdInParams,
	validateEditCareerQuestSandboxProject,
	jwtVerifyAttachUserId,
	editCareerQuestSandboxProject
)

export default careerQuestRoutes
