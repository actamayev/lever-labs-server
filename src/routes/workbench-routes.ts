import express from "express"

import playTune from "../controllers/workbench/play-tune"
import lightAnimation from "../controllers/workbench/light-animation"
import updateBalancePids from "../controllers/workbench/update-balance-pids"
import changeAudibleStatus from "../controllers/workbench/change-audible-status"
import changeBalanceStatus from "../controllers/workbench/change-balance-status"

import confirmPipIsActive from "../middleware/confirm/confirm-pip-is-active"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validateTuneToPlay from "../middleware/request-validation/workbench/validate-tune-to-play"
import validateUpdateBalancePids from "../middleware/request-validation/workbench/validate-update-balance-pids"
import validateChangeAudibleStatus from "../middleware/request-validation/workbench/validate-change-audible-status"
import validateChangeBalanceStatus from "../middleware/request-validation/workbench/validate-change-balance-status"
import validateLightAnimation from "../middleware/request-validation/workbench/validate-light-animation"

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

workbenchRoutes.post(
	"/change-balance-status",
	validateChangeBalanceStatus,
	confirmPipIsActive,
	jwtVerifyAttachUserId,
	changeBalanceStatus
)

workbenchRoutes.post(
	"/update-balance-pids",
	validateUpdateBalancePids,
	confirmPipIsActive,
	jwtVerifyAttachUserId,
	updateBalancePids
)

workbenchRoutes.post(
	"/lights-animation",
	validateLightAnimation,
	confirmPipIsActive,
	jwtVerifyAttachUserId,
	lightAnimation
)

export default workbenchRoutes
