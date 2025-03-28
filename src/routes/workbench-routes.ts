import express from "express"

import playTune from "../controllers/workbench/play-tune"
import validateTuneToPlay from "../middleware/request-validation/workbench/validate-tune-to-play"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"

const workbenchRoutes = express.Router()

// TODO: Add a check to confirm the Pip is active
workbenchRoutes.post(
	"/play-tune",
	validateTuneToPlay,
	jwtVerifyAttachUserId,
	playTune
)

export default workbenchRoutes
