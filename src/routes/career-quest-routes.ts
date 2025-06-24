import express from "express"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import careerQuestChat from "../controllers/career-quest/chat"
import validateChatbotRequest from "../middleware/request-validation/career-quest/validate-chat"

const careerQuestRoutes = express.Router()

careerQuestRoutes.post(
	"/chat",
	jwtVerifyAttachUserId,
	validateChatbotRequest,
	careerQuestChat
)

export default careerQuestRoutes
