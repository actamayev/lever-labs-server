import express from "express"

import playTune from "../controllers/workbench/play-tune"
import changeAudibleStatus from "../controllers/workbench/change-audible-status"

import confirmPipIsActive from "../middleware/confirm/confirm-pip-is-active"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validateTuneToPlay from "../middleware/request-validation/workbench/validate-tune-to-play"
import validateChangeAudibleStatus from "../middleware/request-validation/workbench/validate-change-audible-status"

const workbenchRoutes = express.Router()

workbenchRoutes.post(
	"/play-tune",
	validateTuneToPlay,
	confirmPipIsActive,
	jwtVerifyAttachUserId,
	playTune
)

workbenchRoutes.post(
	"/change-audible-status",
	validateChangeAudibleStatus,
	confirmPipIsActive,
	jwtVerifyAttachUserId,
	changeAudibleStatus
)

export default workbenchRoutes
