import express from "express"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validateChatbotRequest from "../middleware/request-validation/career-quest/validate-chat"

import careerQuestChat from "../controllers/career-quest/start-chat"
import stopChatbotStream from "../controllers/career-quest/stop-chat-stream"
import validateStreamId from "../middleware/request-validation/career-quest/validate-stream-id"

const careerQuestRoutes = express.Router()

careerQuestRoutes.post(
	"/chat",
	jwtVerifyAttachUserId,
	validateChatbotRequest,
	careerQuestChat
)

careerQuestRoutes.post(
	"/stop-chat-stream",
	jwtVerifyAttachUserId,
	validateStreamId,
	stopChatbotStream
)

export default careerQuestRoutes
