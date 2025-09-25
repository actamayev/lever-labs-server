import express from "express"

import confirmPipIsActive from "../middleware/confirm/confirm-pip-is-active"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import checkIfUserConnectedToPip from "../middleware/check/check-if-user-connect-to-pip"
import validatePipUUIDInBody from "../middleware/request-validation/pip/validate-pip-uuid-in-body"
import validateSetSerialConnection from "../middleware/request-validation/pip/validate-set-serial-connection"
import confirmUserIsntAlreadyConnectedToPip from "../middleware/confirm/confirm-user-isnt-already-connected-to-pip"

import stopSensorPolling from "../controllers/pip/stop-sensor-polling"
import streamFirmwareUpdate from "../controllers/pip/stream-firmware-update"
import retrievePipUUIDStatus from "../controllers/pip/retrieve-pip-uuid-status"
import clientConnectToPipRequest from "../controllers/pip/client-connect-to-pip-request"
import setSerialConnectionStatus from "../controllers/pip/set-serial-connection-status"
import clientDisconnectFromPipRequest from "../controllers/pip/client-disconnect-from-pip-request"
import pipTurningOffSerialConnection from "../controllers/pip/pip-turning-off-serial-connection"

const pipRoutes = express.Router()

pipRoutes.post(
	"/client-connect-to-pip-request",
	validatePipUUIDInBody,
	jwtVerifyAttachUserId,
	confirmPipIsActive(false),
	confirmUserIsntAlreadyConnectedToPip,
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

pipRoutes.post(
	"/set-serial-connection",
	validateSetSerialConnection,
	jwtVerifyAttachUserId,
	setSerialConnectionStatus
)

pipRoutes.post(
	"/pip-turning-off-serial-connection",
	validatePipUUIDInBody,
	jwtVerifyAttachUserId,
	pipTurningOffSerialConnection
)

export default pipRoutes
