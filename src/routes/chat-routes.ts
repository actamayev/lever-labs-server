import express from "express"

import attachSandboxChatId from "../middleware/attach/attach-sandbox-chat-id"
import attachChallengeChatId from "../middleware/attach/attach-challenge-chat-id"
import attachCareerIdFromUUID from "../middleware/attach/attach-career-id-from-uuid"
import validateStreamId from "../middleware/request-validation/chat/validate-stream-id"
import validateUserCode from "../middleware/request-validation/quest/validate-user-code"
import attachChallengeIdFromUUID from "../middleware/attach/attach-challenge-id-from-uuid"
import attachCareerConversationHistory from "../middleware/attach/attach-career-conversation-history"
import attachSandboxConversationHistory from "../middleware/attach/attach-sandbox-conversation-history"
import validateSendCareerMessage from "../middleware/request-validation/chat/validate-send-career-message"
import attachChallengeConversationHistory from "../middleware/attach/attach-challenge-conversation-history"
import validateSendSandboxMessage from "../middleware/request-validation/chat/validate-send-sandbox-message"
import validateProjectUUIDInParams from "../middleware/request-validation/sandbox/validate-project-uuid-in-params"
import validateSendChallengeMessage from "../middleware/request-validation/chat/validate-send-challenge-message"
import validateRequestCareerQuestHint from "../middleware/request-validation/chat/validate-request-career-quest-hint"
import confirmSandboxProjectExistsAndValidUserId from "../middleware/confirm/confirm-sandbox-project-exists-and-valid-user-id"

import stopChatbotStream from "../controllers/chat/stop-chat-stream"
import sendCareerMessage from "../controllers/chat/send-career-message"
import sendSandboxMessage from "../controllers/chat/send-sandbox-message"
import checkChallengeCode from "../controllers/chat/check-challenge-code"
import attachCareerChatId from "../middleware/attach/attach-career-chat-id"
import requestChallengeHint from "../controllers/chat/request-challenge-hint"
import sendChallengeMessage from "../controllers/chat/send-challenge-message"
import deleteCareerChatController from "../controllers/chat/delete-career-chat"
import deleteSandboxChatController from "../controllers/chat/delete-sandbox-chat"
import deleteChallengeChatController from "../controllers/chat/delete-challenge-chat"

const chatRoutes = express.Router()

chatRoutes.post(
	"/stop-chat-stream/:streamId",
	validateStreamId,
	stopChatbotStream
)

// Career Quest Chat Routes
chatRoutes.post(
	"/send-challenge-message/:challengeUUID",
	validateSendChallengeMessage,
	attachChallengeIdFromUUID,
	attachChallengeChatId,
	attachChallengeConversationHistory,
	sendChallengeMessage
)

chatRoutes.post(
	"/check-challenge-code/:challengeUUID",
	validateUserCode,
	attachChallengeIdFromUUID,
	attachChallengeChatId,
	checkChallengeCode
)

chatRoutes.post(
	"/request-challenge-hint/:challengeUUID",
	validateRequestCareerQuestHint,
	attachChallengeIdFromUUID,
	attachChallengeChatId,
	attachChallengeConversationHistory,
	requestChallengeHint
)

chatRoutes.post(
	"/delete-challenge-chat/:challengeUUID",
	attachChallengeIdFromUUID,
	deleteChallengeChatController
)

// Career Chat Routes
chatRoutes.post(
	"/send-career-message/:careerUUID",
	validateSendCareerMessage,
	attachCareerIdFromUUID,
	attachCareerChatId,
	attachCareerConversationHistory,
	sendCareerMessage
)

chatRoutes.post(
	"/delete-career-chat/:careerUUID",
	attachCareerIdFromUUID,
	deleteCareerChatController
)

// Sandbox Chat Routes
chatRoutes.post(
	"/send-sandbox-message/:projectUUID",
	validateProjectUUIDInParams,
	validateSendSandboxMessage,
	attachSandboxChatId,
	attachSandboxConversationHistory,
	sendSandboxMessage
)

chatRoutes.post(
	"/delete-sandbox-chat/:projectUUID",
	validateProjectUUIDInParams,
	confirmSandboxProjectExistsAndValidUserId,
	deleteSandboxChatController
)

export default chatRoutes
