import http from "http"
import cors from "cors"
import WebSocket from "ws"
import dotenv from "dotenv"
import express from "express"
import cookieParser from "cookie-parser"
import checkHealth from "./controllers/health-checks/check-health"
import getEnvPath from "./utils/get-env-path"

dotenv.config({ path: getEnvPath() })

const app = express()

app.use(cors({
	origin: function (origin, callback) {
		// Allow requests with no origin (like mobile apps, curl requests, or Postman)
		if (!origin) return callback(null, true)
		return callback(null, true)
	},
	methods: ["GET", "POST"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	credentials: true
}))

app.use(cookieParser())
app.use(express.json())

const server = http.createServer(app)

// Initialize WebSocket server on the HTTP server
const wss = new WebSocket.Server({ server })

wss.on("connection", (ws: WebSocket) => {
	console.log("Client connected")

	// Receive messages from the client
	ws.on("message", (message: WebSocket.RawData) => {
	  console.log(`Received: ${message}`)
	})

	// Send a message to the client
	ws.send("Hello from WebSocket server!")

	// Handle client disconnection
	ws.on("close", () => {
	  console.log("Client disconnected")
	})
})

app.use("/health", checkHealth)

app.use("*", (_req, res) => {
	res.status(404).json({ error: "Route not found"})
})

// Initialization of server:
server.listen(8080, "0.0.0.0", () => {
	console.info("Listening on port 8080")
})
