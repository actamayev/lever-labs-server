import { Express } from "express"
import pipRoutes from "./routes/pip-routes"
import authRoutes from "./routes/auth-routes"
import miscRoutes from "./routes/misc-routes"
import internalRoutes from "./routes/internal-routes"
import workbenchRoutes from "./routes/workbench-routes"
import personalInfoRoutes from "./routes/personal-info-routes"
import checkHealth from "./controllers/health-checks/check-health"
import labActivityTrackingRoutes from "./routes/lab-activity-tracking-routes"
import sandboxRoutes from "./routes/sandbox-routes"

export default function setupRoutes(app: Express): void {
	app.use("/auth", authRoutes)
	app.use("/lab-activity-tracking", labActivityTrackingRoutes)
	app.use("/misc", miscRoutes)
	app.use("/personal-info", personalInfoRoutes)
	app.use("/pip", pipRoutes)
	app.use("/sandbox", sandboxRoutes)
	app.use("/workbench", workbenchRoutes)
	app.use("/internal", internalRoutes)
	app.use("/health", checkHealth)
}
