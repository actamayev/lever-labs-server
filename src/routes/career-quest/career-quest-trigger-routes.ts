import express from "express"
import validatePipUUID from "../../middleware/request-validation/pip/validate-pip-uuid"

import triggerIntroS1P7 from "../../controllers/career-quest/triggers/intro-s1-p7"

const careerQuestTriggerRoutes = express.Router()

careerQuestTriggerRoutes.post("/intro-s1-p7/:pipUUID", validatePipUUID, triggerIntroS1P7)

export default careerQuestTriggerRoutes
