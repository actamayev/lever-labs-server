import express from "express"

import attachPipUUIDData from "../middleware/attach/attach-pip-uuid-data"
import confirmPipIsActive from "../middleware/confirm/confirm-pip-is-active"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validatePipUUID from "../middleware/request-validation/pip/validate-pip-uuid"
import checkIfUserConnectedToPip from "../middleware/check/check-if-user-connect-to-pip"
import validateClientConnectOrDisconnectToPipRequest
	from "../middleware/request-validation/pip/validate-client-connect-or-disconnect-to-pip-request"
import confirmUserPreviouslyAddedUUID from "../middleware/confirm/confirm-user-previously-added-uuid"
import validateAddPipToAccount from "../middleware/request-validation/pip/validate-add-pip-to-account"
import confirmUserHasntAlreadyAddedUUID from "../middleware/confirm/confirm-user-hasnt-already-added-uuid"
import confirmOtherUserIsntConnectedToPip from "../middleware/confirm/confirm-other-user-isnt-connected-to-pip"

import addPipToAccount from "../controllers/pip/add-pip-to-account"
import retrievePipUUIDStatus from "../controllers/pip/retrieve-pip-uuid-status"
import clientConnectToPipRequest from "../controllers/pip/client-connect-to-pip-request"
import retrievePreviouslyAddedPips from "../controllers/pip/retrieve-previously-added-pips"
import clientDisconnectFromPipRequest from "../controllers/pip/client-disconnect-from-pip-request"
import streamFirmwareUpdate from "../controllers/pip/stream-firmware-update"

const pipRoutes = express.Router()

pipRoutes.post(
	"/add-pip-to-account",
	validateAddPipToAccount,
	jwtVerifyAttachUserId,
	attachPipUUIDData,
	confirmUserHasntAlreadyAddedUUID,
	addPipToAccount
)

pipRoutes.post(
	"/client-connect-to-pip-request",
	validateClientConnectOrDisconnectToPipRequest,
	confirmPipIsActive,
	jwtVerifyAttachUserId,
	confirmOtherUserIsntConnectedToPip,
	confirmUserPreviouslyAddedUUID,
	clientConnectToPipRequest
)

pipRoutes.post(
	"/disconnect-from-pip",
	validateClientConnectOrDisconnectToPipRequest,
	confirmPipIsActive,
	jwtVerifyAttachUserId,
	checkIfUserConnectedToPip,
	confirmUserPreviouslyAddedUUID,
	clientDisconnectFromPipRequest
)

pipRoutes.get("/retrieve-previously-added-pips", jwtVerifyAttachUserId, retrievePreviouslyAddedPips)

pipRoutes.get(
	"/retrieve-pip-uuid-status/:pipUUID",
	validatePipUUID,
	jwtVerifyAttachUserId,
	retrievePipUUIDStatus
)

pipRoutes.get(
	"/firmware-update",
	// Pip should send an encoded string (JWT?) with it's PipID
	// Middleware should validate it's Pip ID.
	streamFirmwareUpdate
)

export default pipRoutes
