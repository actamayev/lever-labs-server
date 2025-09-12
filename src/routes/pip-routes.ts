import express from "express"

import confirmPipIsActive from "../middleware/confirm/confirm-pip-is-active"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import checkIfUserConnectedToPip from "../middleware/check/check-if-user-connect-to-pip"
import validatePipUUIDInBody from "../middleware/request-validation/pip/validate-pip-uuid-in-body"
import confirmOtherUserIsntConnectedToPip from "../middleware/confirm/confirm-other-user-isnt-connected-to-pip"

import streamFirmwareUpdate from "../controllers/pip/stream-firmware-update"
import retrievePipUUIDStatus from "../controllers/pip/retrieve-pip-uuid-status"
import clientConnectToPipRequest from "../controllers/pip/client-connect-to-pip-request"
import clientDisconnectFromPipRequest from "../controllers/pip/client-disconnect-from-pip-request"
import stopSensorPolling from "../controllers/pip/stop-sensor-polling"

const pipRoutes = express.Router()

pipRoutes.post(
	"/client-connect-to-pip-request",
	validatePipUUIDInBody,
	jwtVerifyAttachUserId,
	confirmPipIsActive(false),
	confirmOtherUserIsntConnectedToPip,
	clientConnectToPipRequest
)

pipRoutes.post(
	"/disconnect-from-pip",
	validatePipUUIDInBody,
	jwtVerifyAttachUserId,
	confirmPipIsActive(true),
	checkIfUserConnectedToPip,
	clientDisconnectFromPipRequest
)

pipRoutes.post(
	"/retrieve-pip-uuid-status",
	validatePipUUIDInBody,
	jwtVerifyAttachUserId,
	retrievePipUUIDStatus
)

pipRoutes.get("/firmware-update", streamFirmwareUpdate)

pipRoutes.post(
	"/stop-sensor-polling",
	validatePipUUIDInBody,
	jwtVerifyAttachUserId,
	confirmPipIsActive(true),
	stopSensorPolling
)

export default pipRoutes
