import express from "express"

import attachSandboxChatId from "../middleware/attach/attach-sandbox-chat-id"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import attachCareerQuestChatId from "../middleware/attach/attach-career-quest-chat-id"
import validateStreamId from "../middleware/request-validation/chat/validate-stream-id"
import attachCQConversationHistory from "../middleware/attach/attach-cq-conversation-history"
import attachSandboxProjectIdFromUUID from "../middleware/attach/attach-sandbox-project-id-from-uuid"
import attachSandboxConversationHistory from "../middleware/attach/attach-sandbox-conversation-history"
import validateSendSandboxMessage from "../middleware/request-validation/chat/validate-send-sandbox-message"
import attachChallengeIdFromUUID from "../middleware/attach/attach-challenge-id-from-uuid"
import validateCheckCareerQuestCode from "../middleware/request-validation/chat/validate-check-career-quest-code"
import validateProjectUUIDInParams from "../middleware/request-validation/sandbox/validate-project-uuid-in-params"
import validateSendCareerQuestMessage from "../middleware/request-validation/chat/validate-send-career-quest-message"
import validateRequestCareerQuestHint from "../middleware/request-validation/chat/validate-request-career-quest-hint"
import confirmSandboxProjectExistsAndValidUserId from "../middleware/confirm/confirm-sandbox-project-exists-and-valid-user-id"

import stopChatbotStream from "../controllers/chat/stop-chat-stream"
import sendSandboxMessage from "../controllers/chat/send-sandbox-message"
import checkCareerQuestCode from "../controllers/chat/check-career-quest-code"
import deleteSandboxChatController from "../controllers/chat/delete-sandbox-chat"
import sendCareerQuestMessage from "../controllers/chat/send-career-quest-message"
import requestCareerQuestHint from "../controllers/chat/request-career-quest-hint"
import deleteCareerQuestChatController from "../controllers/chat/delete-career-quest-chat"

const chatRoutes = express.Router()

chatRoutes.post(
	"/send-challenge-chat-message/:challengeUUID",
	jwtVerifyAttachUserId,
	validateSendCareerQuestMessage,
	attachChallengeIdFromUUID,
	attachCareerQuestChatId,
	attachCQConversationHistory,
	sendCareerQuestMessage
)

chatRoutes.post(
	"/check-career-quest-code/:challengeUUID",
	jwtVerifyAttachUserId,
	validateCheckCareerQuestCode,
	attachChallengeIdFromUUID,
	attachCareerQuestChatId,
	checkCareerQuestCode
)

chatRoutes.post(
	"/request-career-quest-hint/:challengeUUID",
	jwtVerifyAttachUserId,
	validateRequestCareerQuestHint,
	attachChallengeIdFromUUID,
	attachCareerQuestChatId,
	attachCQConversationHistory,
	requestCareerQuestHint
)

chatRoutes.post(
	"/stop-chat-stream",
	jwtVerifyAttachUserId,
	validateStreamId,
	stopChatbotStream
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

chatRoutes.post(
	"/delete-sandbox-chat/:projectUUID",
	validateProjectUUIDInParams,
	jwtVerifyAttachUserId,
	attachSandboxProjectIdFromUUID,
	confirmSandboxProjectExistsAndValidUserId,
	deleteSandboxChatController
)

chatRoutes.post(
	"/delete-career-quest-chat/:challengeUUID",
	attachChallengeIdFromUUID,
	jwtVerifyAttachUserId,
	deleteCareerQuestChatController
)

export default chatRoutes
