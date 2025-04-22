import dotenv from "dotenv"
import express from "express"
import { Server as WSServer } from "ws"
import { Server as HttpServer } from "http"
import { Server as SocketIOServer } from "socket.io"

import getEnvPath from "./utils/get-env-path"
import jwtVerifySocket from "./middleware/jwt/jwt-verify-socket"
import { configureAppMiddleware, corsOptions } from "./middleware/init-config"

import setupRoutes from "./setup-routes"

import BrowserSocketManager from "./classes/browser-socket-manager"
import Esp32SocketManager from "./classes/esp32/esp32-socket-manager"
import EspLatestFirmwareManager from "./classes/esp32/esp-latest-firmware-manager"

dotenv.config({ path: getEnvPath() })

const app = express()
const httpServer = new HttpServer(app)

configureAppMiddleware(app)

const io = new SocketIOServer(httpServer, {
	path: "/socketio",
	cors: corsOptions
})
io.use(jwtVerifySocket)
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

setupRoutes(app)

app.use("*", (_req, res) => {
	res.status(404).json({ error: "Route not found" })
})

// Start the server
const PORT = process.env.PORT || 8080
httpServer.listen(PORT, () => {
	console.info(`Server is listening on port ${PORT}`)
})
