import cors from "cors"
import dotenv from "dotenv"
import express from "express"
import cookieParser from "cookie-parser"

dotenv.config({ path: ".env" })

const app = express()

app.use(cors({
	origin: function (origin, callback) {
		// Allow requests with no origin (like mobile apps, curl requests, or Postman)
		if (!origin) return callback(null, true)
		return callback(null, true)
	},
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	credentials: true
}))

app.use(cookieParser())
app.use(express.json())

app.use("*", (_req, res) => {
	res.status(404).json({ error: "Route not found"})
})

// Initialization of server:
app.listen(8080, "0.0.0.0", () => {
	console.info("Listening on port 8080")
})
