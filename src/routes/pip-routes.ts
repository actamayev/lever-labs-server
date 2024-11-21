import express from "express"

import attachPipUUIDData from "../middleware/attach/attach-pip-uuid-data"
import jwtVerifyAttachUser from "../middleware/jwt/jwt-verify-attach-user"
import confirmPipIsActive from "../middleware/confirm/confirm-pip-is-active"
import validatePipUUID from "../middleware/request-validation/pip/validate-pip-uuid"
import validateCppCode from "../middleware/request-validation/pip/validate-cpp-code"
import checkIfUserConnectedToPip from "../middleware/check/check-if-user-connect-to-pip"
import confirmUserConnectedToPip from "../middleware/confirm/confirm-user-connected-to-pip"
import validateClientConnectOrDisconnectToPipRequest
	from "../middleware/request-validation/pip/validate-client-connect-or-disconnect-to-pip-request"
import confirmUserPreviouslyAddedUUID from "../middleware/confirm/confirm-user-previously-added-uuid"
import validateAddPipToAccount from "../middleware/request-validation/pip/validate-add-pip-to-account"
import confirmUserHasntAlreadyAddedUUID from "../middleware/confirm/confirm-user-hasnt-already-added-uuid"
import confirmOtherUserIsntConnectedToPip from "../middleware/confirm/confirm-other-user-isnt-connected-to-pip"

import isValidPipUUID from "../controllers/pip/is-valid-pip-uuid"
import addPipToAccount from "../controllers/pip/add-pip-to-account"
import compileAndSendCppToPip from "../controllers/pip/compile-and-send-cpp-to-pip"
import clientConnectToPipRequest from "../controllers/pip/client-connect-to-pip-request"
import retrievePreviouslyAddedPips from "../controllers/pip/retrieve-previously-added-pips"
import clientDisconnectFromPipRequest from "../controllers/pip/client-disconnect-from-pip-request copy"

const pipRoutes = express.Router()

pipRoutes.post(
	"/add-pip-to-account",
	validateAddPipToAccount,
	jwtVerifyAttachUser,
	attachPipUUIDData,
	confirmUserHasntAlreadyAddedUUID,
	addPipToAccount
)

pipRoutes.post(
	"/client-connect-to-pip-request",
	validateClientConnectOrDisconnectToPipRequest,
	confirmPipIsActive,
	jwtVerifyAttachUser,
	confirmOtherUserIsntConnectedToPip,
	confirmUserPreviouslyAddedUUID,
	clientConnectToPipRequest
)

pipRoutes.post(
	"/disconnect-from-pip",
	validateClientConnectOrDisconnectToPipRequest,
	confirmPipIsActive,
	jwtVerifyAttachUser,
	checkIfUserConnectedToPip,
	confirmUserPreviouslyAddedUUID,
	clientDisconnectFromPipRequest
)

pipRoutes.get("/retrieve-previously-added-pips", jwtVerifyAttachUser, retrievePreviouslyAddedPips)

pipRoutes.get(
	"/check-if-pip-uuid-is-valid/:pipUUID",
	validatePipUUID,
	jwtVerifyAttachUser,
	isValidPipUUID
)

// TODO: Comment this out when pushing to staging
pipRoutes.post(
	"/compile-and-send-cpp-to-pip",
	validateCppCode,
	confirmPipIsActive,
	jwtVerifyAttachUser,
	confirmUserPreviouslyAddedUUID,
	confirmUserConnectedToPip,
	compileAndSendCppToPip
)

export default pipRoutes
