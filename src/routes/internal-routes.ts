import express from "express"

import addNewPipUUID from "../controllers/internal/add-new-pip-uuid"

const internalRoutes = express.Router()

internalRoutes.post("/add-pip-uuid", addNewPipUUID)

export default internalRoutes
