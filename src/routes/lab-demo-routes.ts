import express from "express"

import motorControl from "../controllers/lab-demo/motor-control"
import jwtVerifyAttachUser from "../middleware/jwt/jwt-verify-attach-user"
import validateMotorControl from "../middleware/request-validation/lab-demo/validate-motor-control"

const labDemoRoutes = express.Router()

labDemoRoutes.post(
	"/motor-control",
	jwtVerifyAttachUser,
	validateMotorControl,
	motorControl
)

export default labDemoRoutes
