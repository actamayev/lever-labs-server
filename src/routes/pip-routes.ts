import express from "express"

import addPipToAccount from "../controllers/pip/add-pip-to-account"
import retrievePreviouslyAddedPips from "../controllers/pip/retrieve-previously-added-pips"

import attachPipUUIDId from "../middleware/attach/attach-pip-uuid-id"
import jwtVerifyAttachUser from "../middleware/jwt/jwt-verify-attach-user"
import validateAddPipToAccount from "../middleware/request-validation/pip/validate-add-pip-to-account"
import confirmUserHasntAlreadyAddedUUID from "../middleware/confirm/confirm-user-hasnt-already-added-uuid"

const pipRoutes = express.Router()

pipRoutes.post(
	"/add-pip-to-account",
	validateAddPipToAccount,
	jwtVerifyAttachUser,
	attachPipUUIDId,
	confirmUserHasntAlreadyAddedUUID,
	addPipToAccount
)

pipRoutes.get(
	"/retrieve-previously-added-pips",
	jwtVerifyAttachUser,
	retrievePreviouslyAddedPips
)

export default pipRoutes
