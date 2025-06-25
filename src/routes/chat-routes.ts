import express from "express"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validateStreamId from "../middleware/request-validation/career-quest/validate-stream-id"
import validateSendCareerQuestMessage from "../middleware/request-validation/career-quest/validate-send-career-quest-message"

import stopChatbotStream from "../controllers/chat/stop-chat-stream"
import sendCareerQuestMessage from "../controllers/chat/send-career-quest-message"

const chatRoutes = express.Router()

chatRoutes.post(
	"/send-career-quest-message",
	jwtVerifyAttachUserId,
	validateSendCareerQuestMessage,
	sendCareerQuestMessage
)

chatRoutes.post(
	"/stop-chat-stream",
	jwtVerifyAttachUserId,
	validateStreamId,
	stopChatbotStream
)

export default chatRoutes
