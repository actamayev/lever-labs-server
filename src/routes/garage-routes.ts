import express from "express"

import confirmPipIsActive from "../middleware/confirm/confirm-pip-is-active"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validateLightAnimation from "../middleware/request-validation/garage/validate-light-animation"

import lightAnimation from "../controllers/garage/light-animation"

const garageRoutes = express.Router()

garageRoutes.post(
	"/lights-animation",
	validateLightAnimation,
	confirmPipIsActive,
	jwtVerifyAttachUserId,
	lightAnimation
)

export default garageRoutes
