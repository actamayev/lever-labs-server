import { Express } from "express"
import pipRoutes from "./routes/pip-routes"
import authRoutes from "./routes/auth-routes"
import miscRoutes from "./routes/misc-routes"
import internalRoutes from "./routes/internal-routes"
import personalInfoRoutes from "./routes/personal-info-routes"
import checkHealth from "./controllers/health-checks/check-health"

export default function setupRoutes(app: Express): void {
	app.use("/auth", authRoutes)
	app.use("/personal-info", personalInfoRoutes)
	app.use("/misc", miscRoutes)
	app.use("/pip", pipRoutes)
	app.use("/internal", internalRoutes)
	app.use("/health", checkHealth)
}
