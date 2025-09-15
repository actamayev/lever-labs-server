import { Express } from "express"
import pipRoutes from "../../routes/pip-routes"
import authRoutes from "../../routes/auth-routes"
import miscRoutes from "../../routes/misc-routes"
import chatRoutes from "../../routes/chat-routes"
import garageRoutes from "../../routes/garage-routes"
import sandboxRoutes from "../../routes/sandbox-routes"
import teacherRoutes from "../../routes/teacher-routes"
import studentRoutes from "../../routes/student-routes"
import internalRoutes from "../../routes/internal-routes"
import workbenchRoutes from "../../routes/workbench-routes"
import careerQuestRoutes from "../../routes/career-quest-routes"
import personalInfoRoutes from "../../routes/personal-info-routes"
import checkHealth from "../../controllers/health-checks/check-health"
import labActivityTrackingRoutes from "../../routes/lab-activity-tracking-routes"
import jwtVerifyAttachUserId from "../../middleware/jwt/jwt-verify-attach-user-id"

export default function setupRoutes(app: Express): void {
	app.use("/auth", authRoutes)
	app.use("/career-quest", jwtVerifyAttachUserId, careerQuestRoutes)
	app.use("/chat", jwtVerifyAttachUserId, chatRoutes)
	app.use("/lab-activity-tracking", jwtVerifyAttachUserId, labActivityTrackingRoutes)
	app.use("/misc", miscRoutes)
	app.use("/garage", jwtVerifyAttachUserId, garageRoutes)
	app.use("/personal-info", personalInfoRoutes)
	app.use("/pip", pipRoutes)
	app.use("/sandbox", jwtVerifyAttachUserId, sandboxRoutes)
	app.use("/student", jwtVerifyAttachUserId, studentRoutes)
	app.use("/teacher", jwtVerifyAttachUserId, teacherRoutes)
	app.use("/workbench", jwtVerifyAttachUserId, workbenchRoutes)
	app.use("/internal", internalRoutes)
	app.use("/health", checkHealth)
}
