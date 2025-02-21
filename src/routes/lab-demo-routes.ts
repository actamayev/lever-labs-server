import express from "express"

import motorControl from "../controllers/lab-demo/motor-control"
import jwtVerifyAttachUserId from "../middleware/jwt/jwt-verify-attach-user-id"
import validateMotorControl from "../middleware/request-validation/lab-demo/validate-motor-control"

const labDemoRoutes = express.Router()

// labDemoRoutes.post(
// 	"/motor-control",
// 	validateMotorControl,
// 	jwtVerifyAttachUserId,
// 	motorControl
// )

export default labDemoRoutes
