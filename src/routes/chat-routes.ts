import express from "express"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import attachCareerQuestChatId from "../middleware/attach/attach-career-quest-chat-id"
import validateStreamId from "../middleware/request-validation/chat/validate-stream-id"
import attachConversationHistory from "../middleware/attach/attach-conversation-history"
import validateGetCareerQuestChat from "../middleware/request-validation/chat/validate-get-career-quest-chat"
import validateSendCareerQuestMessage from "../middleware/request-validation/chat/validate-send-career-quest-message"

import stopChatbotStream from "../controllers/chat/stop-chat-stream"
import getCareerQuestChat from "../controllers/chat/get-career-quest-chat"
import sendCareerQuestMessage from "../controllers/chat/send-career-quest-message"

const chatRoutes = express.Router()

chatRoutes.post(
	"/send-career-quest-message",
	jwtVerifyAttachUserId,
	validateSendCareerQuestMessage,
	attachCareerQuestChatId,
	attachConversationHistory,
	sendCareerQuestMessage
)

chatRoutes.post(
	"/stop-chat-stream",
	jwtVerifyAttachUserId,
	validateStreamId,
	stopChatbotStream
)

chatRoutes.get(
	"/career-quest-chat/:challengeId",
	jwtVerifyAttachUserId,
	validateGetCareerQuestChat,
	getCareerQuestChat
)

export default chatRoutes
