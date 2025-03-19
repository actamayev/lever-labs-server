import cors from "cors"
import express, { Express } from "express"
import cookieParser from "cookie-parser"
import allowedOrigins from "../utils/get-allowed-origins"

export const corsOptions = {
	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
		if (!origin || allowedOrigins().includes(origin)) return callback(null, true)

		// Allow all Vercel preview URLs in staging environment
		if (process.env.NODE_ENV === "staging" && origin.endsWith(".vercel.app")) {
			return callback(null, true)
		}

		return callback(new Error("CORS not allowed for this origin"))
	},
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	credentials: true,
}
export function configureAppMiddleware(app: Express): void {
	app.use(cors(corsOptions))
	app.use(cookieParser())
	app.use(express.json())
}
