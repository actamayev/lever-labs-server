import express from "express"

import addNewPipUUID from "../controllers/internal/add-new-pip-uuid"

import validateAddPipUUID from "../middleware/request-validation/internal/validate-add-pip-uuid"
import confirmPipUUIDDoesntAlreadyExist from "../middleware/confirm/confirm-pip-uuid-doesnt-already-exist"

const internalRoutes = express.Router()

internalRoutes.post(
	"/add-pip-uuid",
	validateAddPipUUID,
	confirmPipUUIDDoesntAlreadyExist,
	addNewPipUUID
)

export default internalRoutes
