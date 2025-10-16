import express from "express"

import validateDecodeEmailSubscriber from "../middleware/request-validation/internal/validate-decode-email-subscriber"
import { validateLedColorsDirectly, validateLedColorsToAll } from "../middleware/request-validation/internal/validate-led-colors"

import generateUUID from "../controllers/internal/generate-uuid"
import forceFirmwareRefetch from "../controllers/internal/force-firmware-refetch"
import addNewPipUUID from "../controllers/internal/add-new-pip-uuid"
import decodeEmailSubscriber from "../controllers/internal/decode-email-subscriber"
import displayLedColorsDirectly from "../controllers/internal/display-led-colors-directly"
import displayLedColorsToAll from "../controllers/internal/display-led-colors-to-all"
import playSoundToAll from "../controllers/internal/play-sound-to-all"
import getLatestFirmwareData from "../controllers/internal/get-latest-firmware-data"

const internalRoutes = express.Router()

internalRoutes.post("/add-pip-uuid", addNewPipUUID)

internalRoutes.post("/decode-email-subscriber", validateDecodeEmailSubscriber, decodeEmailSubscriber)

internalRoutes.get("/generate-uuid", generateUUID)

internalRoutes.post("/display-led-colors", validateLedColorsDirectly, displayLedColorsDirectly)

internalRoutes.post("/display-led-colors-to-all", validateLedColorsToAll, displayLedColorsToAll)

internalRoutes.post("/play-sound-to-all", playSoundToAll)

internalRoutes.post("/firmware-update", forceFirmwareRefetch)

internalRoutes.get("/get-latest-firmware-data", getLatestFirmwareData)

export default internalRoutes
