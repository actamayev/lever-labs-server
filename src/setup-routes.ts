import { Express } from "express"
import pipRoutes from "./routes/pip-routes"
import authRoutes from "./routes/auth-routes"
import miscRoutes from "./routes/misc-routes"
import chatRoutes from "./routes/chat-routes"
import garageRoutes from "./routes/garage-routes"
import sandboxRoutes from "./routes/sandbox-routes"
import teacherRoutes from "./routes/teacher-routes"
import internalRoutes from "./routes/internal-routes"
import workbenchRoutes from "./routes/workbench-routes"
import careerQuestRoutes from "./routes/career-quest-routes"
import personalInfoRoutes from "./routes/personal-info-routes"
import checkHealth from "./controllers/health-checks/check-health"
import labActivityTrackingRoutes from "./routes/lab-activity-tracking-routes"

export default function setupRoutes(app: Express): void {
	app.use("/auth", authRoutes)
	app.use("/career-quest", careerQuestRoutes)
	app.use("/chat", chatRoutes)
	app.use("/lab-activity-tracking", labActivityTrackingRoutes)
	app.use("/misc", miscRoutes)
	app.use("/garage", garageRoutes)
	app.use("/personal-info", personalInfoRoutes)
	app.use("/pip", pipRoutes)
	app.use("/sandbox", sandboxRoutes)
	app.use("/teacher", teacherRoutes)
	app.use("/workbench", workbenchRoutes)
	app.use("/internal", internalRoutes)
	app.use("/health", checkHealth)
}
