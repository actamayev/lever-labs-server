import express from "express"

import confirmPipIsActive from "../middleware/confirm/confirm-pip-is-active"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validateDisplayBuffer from "../middleware/request-validation/garage/validate-display-buffer"
import validateLightAnimation from "../middleware/request-validation/garage/validate-light-animation"

import lightAnimation from "../controllers/garage/light-animation"
import updateDisplay from "../controllers/garage/update-display"

const garageRoutes = express.Router()

garageRoutes.post(
	"/lights-animation",
	validateLightAnimation,
	confirmPipIsActive,
	jwtVerifyAttachUserId,
	lightAnimation
)

garageRoutes.post(
	"/display-buffer",
	validateDisplayBuffer,
	confirmPipIsActive,
	jwtVerifyAttachUserId,
	updateDisplay
)


export default garageRoutes
