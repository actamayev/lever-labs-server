import express from "express"

import attachPipUUIDData from "../middleware/attach/attach-pip-uuid-data"
import jwtVerifyAttachUser from "../middleware/jwt/jwt-verify-attach-user"
import confirmPipIsActive from "../middleware/confirm/confirm-pip-is-active"
import validatePipUUID from "../middleware/request-validation/pip/validate-pip-uuid"
import confirmPipIsUnconnected from "../middleware/confirm/confirm-pip-is-unconnected"
import confirmUserPreviouslyAddedUUID from "../middleware/confirm/confirm-user-previously-added-uuid"
import validateAddPipToAccount from "../middleware/request-validation/pip/validate-add-pip-to-account"
import confirmUserHasntAlreadyAddedUUID from "../middleware/confirm/confirm-user-hasnt-already-added-uuid"
import validateClientConnectToPipRequest from "../middleware/request-validation/pip/validate-client-connect-to-pip-request"

import isValidPipUUID from "../controllers/pip/is-valid-pip-uuid"
import addPipToAccount from "../controllers/pip/add-pip-to-account"
import clientConnectToPipRequest from "../controllers/pip/client-connect-to-pip-request"
import retrievePreviouslyAddedPips from "../controllers/pip/retrieve-previously-added-pips"

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
	validateClientConnectToPipRequest,
	confirmPipIsActive,
	confirmPipIsUnconnected,
	jwtVerifyAttachUser,
	confirmUserPreviouslyAddedUUID,
	clientConnectToPipRequest
)

pipRoutes.get("/retrieve-previously-added-pips", jwtVerifyAttachUser, retrievePreviouslyAddedPips)

pipRoutes.get(
	"/check-if-pip-uuid-is-valid/:pipUUID",
	validatePipUUID,
	jwtVerifyAttachUser,
	isValidPipUUID
)

export default pipRoutes
