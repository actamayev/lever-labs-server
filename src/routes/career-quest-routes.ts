import express from "express"

import confirmPipIsActive from "../middleware/confirm/confirm-pip-is-active"
import attachCareerIdFromUUID from "../middleware/attach/attach-career-id-from-uuid"
import attachChallengeIdFromUUID from "../middleware/attach/attach-challenge-id-from-uuid"
import validatePipUUIDInBody from "../middleware/request-validation/pip/validate-pip-uuid-in-body"
import confirmUserPreviouslyAddedUUID from "../middleware/confirm/confirm-user-previously-added-uuid"
import validateCqUserProgress from "../middleware/request-validation/career-quest/validate-user-progress"
import validateCareerTrigger from "../middleware/request-validation/career-quest/validate-trigger-message"
import validateEditSandboxProject from "../middleware/request-validation/sandbox/validate-edit-sandbox-project"

import stopCareerTrigger from "../controllers/career-quest/stop-career-trigger"
import markChallengeAsSeen from "../controllers/career-quest/mark-challenge-as-seen"
import triggerCareerQuestMessage from "../controllers/career-quest/trigger-career-quest-message"
import retrieveCareerChallengeData from "../controllers/career-quest/retrieve-career-progress-data"
import editChallengeSandboxProject from "../controllers/career-quest/edit-challenge-sandbox-project"
import updateCareerQuestUserProgress from "../controllers/career-quest/update-career-quest-user-progress"

const careerQuestRoutes = express.Router()

careerQuestRoutes.post(
	"/edit-challenge-sandbox-project/:challengeUUID",
	validateEditSandboxProject,
	attachChallengeIdFromUUID,
	editChallengeSandboxProject
)

careerQuestRoutes.get("/get-career-progress-data/:careerUUID", attachCareerIdFromUUID, retrieveCareerChallengeData)

careerQuestRoutes.post(
	"/update-career-quest-user-progress/:careerUUID",
	attachCareerIdFromUUID,
	validateCqUserProgress,
	updateCareerQuestUserProgress
)

careerQuestRoutes.post("/mark-challenge-as-seen/:challengeUUID", attachChallengeIdFromUUID, markChallengeAsSeen)

careerQuestRoutes.post(
	"/career-trigger",
	validateCareerTrigger,
	confirmPipIsActive,
	confirmUserPreviouslyAddedUUID,
	triggerCareerQuestMessage
)

careerQuestRoutes.post(
	"/stop-career-trigger",
	validatePipUUIDInBody,
	confirmPipIsActive,
	confirmUserPreviouslyAddedUUID,
	stopCareerTrigger
)

export default careerQuestRoutes
