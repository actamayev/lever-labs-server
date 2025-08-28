import express from "express"

import attachCareerIdFromUUID from "../../middleware/attach/attach-career-id-from-uuid"
import attachChallengeIdFromUUID from "../../middleware/attach/attach-challenge-id-from-uuid"
import validateCqUserProgress from "../../middleware/request-validation/career-quest/validate-user-progress"
import validateEditSandboxProject from "../../middleware/request-validation/sandbox/validate-edit-sandbox-project"

import markChallengeAsSeen from "../../controllers/career-quest/mark-challenge-as-seen"
import retrieveCareerChallengeData from "../../controllers/career-quest/retrieve-career-progress-data"
import editChallengeSandboxProject from "../../controllers/career-quest/edit-challenge-sandbox-project"
import updateCareerQuestUserProgress from "../../controllers/career-quest/update-career-quest-user-progress"
import careerQuestTriggerRoutes from "./career-quest-trigger-routes"

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

careerQuestRoutes.use("/trigger", careerQuestTriggerRoutes)

export default careerQuestRoutes
