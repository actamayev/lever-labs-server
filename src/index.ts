import dotenv from "dotenv"
import express from "express"
import { isUndefined } from "lodash"
import { Server as WSServer } from "ws"
import { Server as HttpServer } from "http"
import { Server as SocketIOServer } from "socket.io"

import getEnvPath from "./utils/config/get-env-path"
import jwtVerifySocket from "./middleware/jwt/jwt-verify-socket"
import { configureAppMiddleware, corsOptions } from "./middleware/init-config"

import setupRoutes from "./utils/config/setup-routes"

import BrowserSocketManager from "./classes/browser-socket-manager"
import Esp32SocketManager from "./classes/esp32/esp32-socket-manager"
import EspLatestFirmwareManager from "./classes/esp32/esp-latest-firmware-manager"
import MongoClientManager from "./classes/mongo-client-class"

process.on("unhandledRejection", (reason, promise) => {
	console.error("🚨 Unhandled Promise Rejection at:", promise, "reason:", reason)
	console.error("Stack trace:", reason instanceof Error ? reason.stack : "No stack trace available")
	// Log but don't crash - let PM2 handle restarts if needed
})

process.on("uncaughtException", (error) => {
	console.error("💥 Uncaught Exception:", error)
	// This should crash and restart
	process.exit(1)
})

dotenv.config({ path: getEnvPath() })

const app = express()
const httpServer = new HttpServer(app)

console.info(`🚀 Server starting - PM2 Instance: ${process.env.PM2_INSTANCE_ID || "standalone"}`)
console.info(`💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`)

configureAppMiddleware(app)

const io = new SocketIOServer(httpServer, {
	path: "/socketio",
	cors: corsOptions
})
io.use((socket, next) => {
	void jwtVerifySocket(socket, next)
})
BrowserSocketManager.getInstance(io) // Directly use getInstance with io

// Initialize WebSocket server for ESP32 connections
const esp32WSServer = new WSServer({ noServer: true })
Esp32SocketManager.getInstance(esp32WSServer) // Directly use getInstance with wss

void EspLatestFirmwareManager.getInstance()

// Handle WebSocket upgrade for ESP32 connections
httpServer.on("upgrade", (request, socket, head) => {
	if (request.url !== "/esp32") return
	esp32WSServer.handleUpgrade(request, socket, head, (ws) => {
		esp32WSServer.emit("connection", ws, request)
	})
})

void (async (): Promise<void> => {
	try {
		console.info("🔌 Connecting to MongoDB...")
		await MongoClientManager.connect()
	} catch (error) {
		console.error("❌ Failed to connect to MongoDB:", error)
		console.error("Server will continue but MongoDB-dependent features will fail")
	}
})()

setupRoutes(app)

app.use((_req, res) => {
	res.status(404).json({ error: "Route not found" })
})

if (!isUndefined(process.env.NODE_ENV))  {
	setInterval(() => {
		const usage = process.memoryUsage()
		const espConnections = Esp32SocketManager.getInstance().getAllConnectedPipUUIDs().length

		// Add disk space monitoring
		// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
		require("child_process").exec("df -h /", (error: any, stdout: any) => {
			if (!error) {
				const diskUsage = stdout.split("\n")[1].split(/\s+/)[4]
				console.info(`📊 Memory: ${Math.round(usage.heapUsed / 1024 / 1024)}MB | ESP32: ${espConnections} | Disk: ${diskUsage}`)
			}
		})
	}, 30000)
}

// Start the server
const PORT = process.env.PORT || 8080
httpServer.listen(PORT, () => {
	console.info(`Server is listening on port ${PORT}`)
})
