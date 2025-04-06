import express from "express"

import playTune from "../controllers/workbench/play-tune"
import updateBalancePids from "../controllers/workbench/update-balance-pids"
import changeAudibleStatus from "../controllers/workbench/change-audible-status"
import changeBalanceStatus from "../controllers/workbench/change-balance-status"

import confirmPipIsActive from "../middleware/confirm/confirm-pip-is-active"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validateTuneToPlay from "../middleware/request-validation/workbench/validate-tune-to-play"
import validateUpdateBalancePids from "../middleware/request-validation/workbench/validate-update-balance-pids"
import validateChangeAudibleStatus from "../middleware/request-validation/workbench/validate-change-audible-status"
import validateChangeBalanceStatus from "../middleware/request-validation/workbench/validate-change-balance-status"
import validateDisplayLights from "../middleware/request-validation/workbench/validate-display-lights"
import displayLights from "../controllers/workbench/display-lights"

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
	"/display-lights",
	validateDisplayLights,
	confirmPipIsActive,
	jwtVerifyAttachUserId,
	displayLights
)

export default workbenchRoutes
