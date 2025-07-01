import express from "express"

import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import attachCareerQuestChatId from "../middleware/attach/attach-career-quest-chat-id"
import validateStreamId from "../middleware/request-validation/chat/validate-stream-id"
import attachCQConversationHistory from "../middleware/attach/attach-cq-conversation-history"
import validateGetCareerQuestChat from "../middleware/request-validation/chat/validate-get-career-quest-chat"
import validateSendCareerQuestMessage from "../middleware/request-validation/chat/validate-send-career-quest-message"

import stopChatbotStream from "../controllers/chat/stop-chat-stream"
import getCareerQuestChat from "../controllers/chat/get-career-quest-chat"
import attachSandboxChatId from "../middleware/attach/attach-sandbox-chat-id"
import sendCareerQuestMessage from "../controllers/chat/send-career-quest-message"
import validateSendSandboxMessage from "../middleware/request-validation/chat/validate-send-sandbox-message"
import attachSandboxConversationHistory from "../middleware/attach/attach-sandbox-conversation-history"
import attachSandboxProjectIdFromUUID from "../middleware/attach/attach-sandbox-project-id-from-uuid"
import validateProjectUUIDInParams from "../middleware/request-validation/sandbox/validate-project-uuid-in-params"
import sendSandboxMessage from "../controllers/chat/send-sandbox-message"

const chatRoutes = express.Router()

chatRoutes.post(
	"/send-career-quest-message",
	jwtVerifyAttachUserId,
	validateSendCareerQuestMessage,
	attachCareerQuestChatId,
	attachCQConversationHistory,
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

chatRoutes.post(
	"/send-sandbox-message/:projectUUID",
	validateProjectUUIDInParams,
	jwtVerifyAttachUserId,
	validateSendSandboxMessage,
	attachSandboxProjectIdFromUUID,
	attachSandboxChatId,
	attachSandboxConversationHistory,
	sendSandboxMessage
)

export default chatRoutes
