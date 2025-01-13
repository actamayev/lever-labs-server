import express from "express"

import addNewPipUUID from "../controllers/internal/add-new-pip-uuid"
import decodeEmailSubscriber from "../controllers/internal/decode-email-subscriber"
import validateDecodeEmailSubscriber from "../middleware/request-validation/internal/validate-decode-email-subscriber"

const internalRoutes = express.Router()

internalRoutes.post("/add-pip-uuid", addNewPipUUID)

internalRoutes.post("/decode-email-subscriber", validateDecodeEmailSubscriber, decodeEmailSubscriber)

export default internalRoutes
