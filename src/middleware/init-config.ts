import cors from "cors"
import express, { Express } from "express"
import cookieParser from "cookie-parser"
import allowedOrigins from "../utils/config/get-allowed-origins"

export const corsOptions = {
	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
		if (!origin || allowedOrigins().includes(origin)) return callback(null, true)

		return callback(new Error("CORS not allowed for this origin"))
	},
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: [
		"Content-Type",
		"X-Requested-With",
		"Accept",
		"Origin"
	],
	exposedHeaders: [
		"Set-Cookie" // Allow frontend to see Set-Cookie headers (though not needed for httpOnly)
	],
	credentials: true, // This is already correct - essential for cookies!
}

export function configureAppMiddleware(app: Express): void {
	app.use(cors(corsOptions))
	app.use(cookieParser())
	app.use(express.json())
}
