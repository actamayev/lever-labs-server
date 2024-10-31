import cors from "cors"
import dotenv from "dotenv"
import express from "express"
import cookieParser from "cookie-parser"
import { Server as HttpServer } from "http"
import WebSocket, { Server as WSServer } from "ws"
import { Server as SocketIOServer } from "socket.io"

import getEnvPath from "./utils/get-env-path"
import allowedOrigins from "./utils/get-allowed-origins"

import pipRoutes from "./routes/pip-routes"
import authRoutes from "./routes/auth-routes"
import internalRoutes from "./routes/internal-routes"
import personalInfoRoutes from "./routes/personal-info-routes"

import checkHealth from "./controllers/health-checks/check-health"
import jwtVerifySocket from "./middleware/jwt/jwt-verify-socket"
import ClientSocketManager from "./classes/client-socket-manager"

dotenv.config({ path: getEnvPath() })

const app = express()

app.use(cors({
	origin: function (origin, callback) {
		// Allow requests with no origin (like mobile apps, curl requests, or Postman)
		if (!origin) return callback(null, true)
		if (allowedOrigins().indexOf(origin) === -1) {
			const msg = "The CORS policy for this site does not allow access from the specified Origin."
			return callback(new Error(msg), false)
		}
		return callback(null, true)
	},
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	credentials: true
}))

app.use(cookieParser())
app.use(express.json())

const httpServer = new HttpServer(app)

const io = new SocketIOServer(httpServer,
	{
		path: "/socketio",
		cors: {
		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
			origin: function (origin, callback) {
			// Allow requests with no origin (like mobile apps, curl requests, or Postman)
				if (!origin) return callback(null, true)
				if (allowedOrigins().indexOf(origin) === -1) {
					const msg = "The CORS policy for this site does not allow access from the specified Origin."
					return callback(new Error(msg), false)
				}
				return callback(null, true)
			},
			methods: ["GET", "POST"],
			credentials: true
		},
	})

io.use(jwtVerifySocket)
ClientSocketManager.assignIo(io)

// Initialize WebSocket server on the HTTP server
const esp32WSServer = new WSServer({ noServer: true })

httpServer.on("upgrade", (request, socket, head) => {
	if (request.url === "/esp32") {
	  esp32WSServer.handleUpgrade(request, socket, head, (ws) => {
			esp32WSServer.emit("connection", ws, request)
	  })
	}
})

esp32WSServer.on("connection", (ws: WebSocket) => {
	console.log("ESP32 connected")

	ws.on("message", (message) => {
	  console.log("Message from ESP32:", message)
	})

	ws.on("close", () => {
	  console.log("ESP32 disconnected")
	})
})

app.use("/auth", authRoutes)
app.use("/personal-info", personalInfoRoutes)
app.use("/pip", pipRoutes)

// Internal Use:
app.use("/internal", internalRoutes)
app.use("/health", checkHealth)

app.use("*", (_req, res) => {
	res.status(404).json({ error: "Route not found"})
})

// Initialization of server:
httpServer.listen(8080, "0.0.0.0", () => {
	console.info("Listening on port 8080")
})
