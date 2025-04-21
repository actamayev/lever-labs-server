import express from "express"

import validateDecodeEmailSubscriber from "../middleware/request-validation/internal/validate-decode-email-subscriber"

import generateUUID from "../controllers/internal/generate-uuid"
import forceFirmwareRefetch from "../controllers/internal/force-firmware-refetch"
import addNewPipUUID from "../controllers/internal/add-new-pip-uuid"
import decodeEmailSubscriber from "../controllers/internal/decode-email-subscriber"
import displayLedColorsDirectly from "../controllers/internal/display-led-colors-directly"
import getLatestFirmwareData from "../controllers/internal/get-latest-firmware-data"

const internalRoutes = express.Router()

internalRoutes.post("/add-pip-uuid", addNewPipUUID)

internalRoutes.post("/decode-email-subscriber", validateDecodeEmailSubscriber, decodeEmailSubscriber)

internalRoutes.get("/generate-uuid", generateUUID)

internalRoutes.post("/display-led-colors", displayLedColorsDirectly)

internalRoutes.post("/firmware-update", forceFirmwareRefetch)

internalRoutes.post("/get-latest-firmware-data", getLatestFirmwareData)

export default internalRoutes
