import express from "express"

import careerQuestChat from "../controllers/career-quest/chat"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validateChatbotRequest from "../middleware/request-validation/career-quest/validate-chat"

const careerQuestRoutes = express.Router()

careerQuestRoutes.post(
	"/chat",
	jwtVerifyAttachUserId,
	validateChatbotRequest,
	careerQuestChat
)

export default careerQuestRoutes
