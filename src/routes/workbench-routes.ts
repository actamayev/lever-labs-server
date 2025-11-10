import express from "express"


import confirmPipIsActive from "../middleware/confirm/confirm-pip-is-active"
import validateChangeVolume from "../middleware/request-validation/workbench/validate-change-volume"
import validateUpdateBalancePids from "../middleware/request-validation/workbench/validate-update-balance-pids"
import validateChangeAudibleStatus from "../middleware/request-validation/workbench/validate-change-audible-status"
import validateChangeBalanceStatus from "../middleware/request-validation/workbench/validate-change-balance-status"

import changeVolume from "../controllers/workbench/change-volume"
import updateBalancePids from "../controllers/workbench/update-balance-pids"
import changeAudibleStatus from "../controllers/workbench/change-audible-status"
import changeBalanceStatus from "../controllers/workbench/change-balance-status"

const workbenchRoutes = express.Router()

workbenchRoutes.post(
	"/change-audible-status",
	validateChangeAudibleStatus,
	confirmPipIsActive(true),
	changeAudibleStatus
)

workbenchRoutes.post(
	"/change-volume",
	validateChangeVolume,
	confirmPipIsActive(true),
	changeVolume
)

workbenchRoutes.post(
	"/change-balance-status",
	validateChangeBalanceStatus,
	confirmPipIsActive(true),
	changeBalanceStatus
)

workbenchRoutes.post(
	"/update-balance-pids",
	validateUpdateBalancePids,
	confirmPipIsActive(true),
	updateBalancePids
)

export default workbenchRoutes
