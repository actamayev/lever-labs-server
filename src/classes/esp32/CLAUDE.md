# src/classes/esp32 Directory - Claude Instructions

## Overview
This directory contains all ESP32 hardware integration logic. ESP32 microcontrollers (called "pips" or "robots" in the codebase) connect to the server via WebSocket to enable real-time hardware control, sensor data streaming, and firmware updates. This module manages device connections, communication protocols, and device lifecycle.

## Architecture

### Two-Channel WebSocket Architecture

ESP32 devices connect via **two separate WebSocket servers**:

1. **Command Channel** - For commands and control
   - Server name: `commandWSS` (WebSocket Server)
   - Purpose: Send commands to device, receive responses
   - Lower throughput, bidirectional control
   - Event-driven message responses

2. **Sensor Channel** - For continuous sensor data streaming
   - Server name: `sensorWSS` (WebSocket Server)
   - Purpose: High-frequency sensor readings
   - One-way streaming (device → server)
   - Real-time data flow (IMU, encoders, etc.)

**Why Two Channels?**
- Separates control from telemetry
- Prevents command latency from sensor flooding
- Sensor streaming can be high-bandwidth without blocking commands
- Allows independent scaling and resource allocation

## Core Classes

### Esp32SocketManager (`esp32-socket-manager.ts`)

**Singleton** that manages all ESP32 device connections.

**Key Responsibilities:**
- Accept new device connections on command and sensor channels
- Validate device identity (via `x-pip-id` header)
- Maintain registry of active connections by device ID
- Route messages to/from devices
- Handle device disconnections and cleanup
- Coordinate timeout detection and reconnection

**Key Methods:**
```typescript
// Get active command connection for a device
getCommandConnection(pipUUID: PipUUID): SingleESP32CommandConnection | undefined

// Send message to device via command channel
sendCommandMessage(pipUUID: PipUUID, message: any): void

// Register new device connection
registerConnection(pipUUID: PipUUID, connection: SingleESP32CommandConnection): void

// Handle device disconnection
handleDeviceDisconnection(pipUUID: PipUUID): void
```

**Message Flow:**
1. Device connects with `x-pip-id` header
2. Manager validates device exists in database
3. Creates `SingleESP32CommandConnection` wrapper
4. Stores connection in `connections` Map by device ID
5. Routes incoming messages from browser → device
6. Routes sensor data from device → browser

**Timeout Detection:**
- Devices must send heartbeat messages periodically
- Manager checks for 90-minute inactivity timeout
- Stale connections are cleaned up automatically
- Heartbeat constant: `NINETY_MINUTES_MS = 90 * 60 * 1000`

**Connection Types:**
```typescript
// TypeScript representation
interface ESP32ConnectionInfo {
  connection: SingleESP32CommandConnection
  userId: string // User who owns this device
  connectedAt: number // Timestamp
}
```

### SingleESP32CommandConnection (`single-esp32-connection.ts`)

**Represents a single device connection** with health monitoring.

**Key Responsibilities:**
- Manage WebSocket lifecycle for one device
- Monitor connection health via ping/pong
- Detect dead connections
- Cleanup on disconnect
- Track heartbeat from device

**Connection Health Monitoring:**
Uses a three-layer health check system:

1. **Ping/Pong Protocol** (WebSocket level)
   - Server sends `ping` every 750ms
   - Device responds with `pong`
   - If 2 consecutive pings missed → connection dead
   - Constant: `PING_INTERVAL = 750`

2. **Heartbeat Messages** (Application level)
   - Device sends heartbeat messages periodically
   - Server tracks last heartbeat timestamp
   - If > 3 seconds without heartbeat → timeout
   - Constant: `HEARTBEAT_TIMEOUT = 3000`

3. **Missed Ping Tracking**
   - `MAX_MISSED_PINGS = 2` consecutive failures
   - After max misses, connection terminates
   - Counter resets on successful pong or heartbeat

**Key Methods:**
```typescript
// Called when device sends heartbeat message
updateHeartbeat(): void

// Reset the ping counter (usually on successful message)
resetPingCounter(): void

// Clean up connection and notify manager
dispose(skipCallback?: boolean): void
```

**Health Check Flow:**
```
Every 750ms:
  1. Check if heartbeat timeout (> 3s since last heartbeat)
     → If yes: cleanup("heartbeat_timeout")
  2. Check if too many missed pings (>= 2)
     → If yes: cleanup("ping_timeout")
  3. If connection alive: send ping
     → On pong: _isAlive = true, resetCounter
     → On no pong: increment _missedPingCount
```

**Cleanup Reasons:**
- `socket_closed` - Client closed connection
- `socket_error` - WebSocket error occurred
- `ping_timeout` - Too many missed pings
- `heartbeat_timeout` - No heartbeat messages
- `ping_failed` - Failed to send ping
- `disposed` - Manually disposed

### SendEsp32MessageManager (`send-esp32-message-manager.ts`)

**Singleton** that handles outbound messages to ESP32 devices.

**Key Responsibilities:**
- Format and send commands to devices
- Coordinate with device capabilities
- Handle firmware update messaging
- Build protocol-compliant messages

**Key Methods:**
```typescript
// Send firmware update notification
transferUpdateAvailableMessage(pipUUID: PipUUID, payload: DeviceInitialDataPayload): void

// Send LED control commands
sendLedControlCommand(pipUUID: PipUUID, ledData: LedControlData): void

// Send tone/sound commands
sendToneCommand(pipUUID: PipUUID, toneType: ToneType): void

// Send C++ bytecode for execution
sendBytecodeToDevice(pipUUID: PipUUID, bytecode: Bytecode): void
```

**Message Building:**
Uses `MessageBuilder` from common library to format messages according to protocol specification:
```typescript
const message = MessageBuilder.createCommand({
  type: "LED_CONTROL",
  data: ledData
})
await socket.send(JSON.stringify(message))
```

**Dependencies:**
- Depends on `Esp32SocketManager` to get device connections
- Depends on `EspLatestFirmwareManager` for version info
- Depends on `BrowserSocketManager` to notify browser of results

### EspLatestFirmwareManager (`esp-latest-firmware-manager.ts`)

**Manages firmware version tracking and updates.**

**Key Responsibilities:**
- Track latest available firmware version
- Coordinate Over-The-Air (OTA) updates
- Notify devices of available updates
- Handle firmware update progress

**Typical Firmware Update Flow:**
1. Server detects newer firmware available
2. Sends `UPDATE_AVAILABLE` message to device
3. Device downloads firmware from S3 URL
4. Device flashes new firmware
5. Device reboots with new version
6. Device sends version confirmation back

## Protocol & Message Types

### Common Message Format

All messages follow protocol from `@actamayev/lever-labs-common-ts/protocol`:

```typescript
interface Message {
  type: string              // Message type identifier
  timestamp: number         // Server timestamp
  data?: any               // Payload
  deviceId?: PipUUID       // Device identifier
}
```

### Message Types Handled

**From Device (Inbound):**
- `HEARTBEAT` - Device status check
- `SENSOR_DATA` - IMU, encoder readings
- `EXECUTION_COMPLETE` - Bytecode execution done
- `ERROR` - Device error report

**To Device (Outbound):**
- `COMMAND` - Generic command
- `LED_CONTROL` - Control RGB LED
- `TONE` - Play sound
- `BYTECODE` - Execute compiled code
- `UPDATE_AVAILABLE` - Firmware update available

## Device Connection Lifecycle

```
1. Device Powers On
   ↓
2. Device Connects to Command Channel WebSocket
   ├─ Sends x-pip-id header with device UUID
   ├─ Manager validates device exists in DB
   └─ Creates SingleESP32CommandConnection

3. Connection Established
   ├─ Sensor channel opens separately
   ├─ Device starts heartbeat messages
   ├─ Manager starts ping/pong health check
   └─ Connection stored in connections Map

4. Active Communication
   ├─ Browser sends commands → Manager → Device
   ├─ Device sends responses → Manager → Browser
   ├─ Device streams sensor data on sensor channel
   └─ Ping/pong and heartbeats monitor health

5. Device Disconnection (any reason)
   ├─ Cleanup handler fires
   ├─ Connection removed from Map
   ├─ Resources released
   ├─ Notify browser of disconnection
   └─ Browser UI shows device offline
```

## Integration with Browser Socket Manager

**ESP32 ↔ Browser Communication Flow:**

```
Browser Command:
  Browser → BrowserSocketManager → Manager routes to device
  ↓
  ESP32SocketManager → SendEsp32MessageManager
  ↓
  Message sent to device via command WebSocket

Device Response:
  Device → ESP32SocketManager (via message event)
  ↓
  Manager routes message back to browser
  ↓
  BrowserSocketManager → Browser displays result
```

The two managers coordinate:
- `ESP32SocketManager` handles device connections
- `BrowserSocketManager` handles browser connections
- `HubManager` coordinates cross-system messaging

## Adding New Device Features

### To Support a New Device Command:

1. **Define message type** in common library types
2. **Add handler in SingleESP32CommandConnection** or esp32-socket-manager
3. **Create send method in SendEsp32MessageManager**
4. **Add controller/route** in main server to accept browser request
5. **Test** with physical ESP32 or simulator

**Example: Adding LED Control**
```typescript
// 1. Type already exists: LedControlData

// 2. Handle device LED response in esp32-socket-manager
private handleLedResponse(pipUUID: PipUUID, data: LedResponseData): void {
  // Process response
}

// 3. SendEsp32MessageManager method
public sendLedCommand(pipUUID: PipUUID, ledData: LedControlData): void {
  const socket = this.getPipConnectionSocket(pipUUID)
  const message = MessageBuilder.createCommand("LED_CONTROL", ledData)
  socket.send(JSON.stringify(message))
}

// 4. Browser route
app.post("/api/pip/:pipUUID/led", (req, res) => {
  SendEsp32MessageManager.getInstance().sendLedCommand(req.params.pipUUID, req.body)
  res.json({ success: true })
})

// 5. Test with device
```

## Important Patterns

### Connection Validation
Always validate device exists before operations:
```typescript
const connection = esp32SocketManager.getCommandConnection(pipUUID)
if (!connection) {
  throw new Error(`Device ${pipUUID} not connected`)
}
```

### Error Handling
Device connection errors should be caught and reported:
```typescript
try {
  sendEsp32MessageManager.sendBytecodeToDevice(pipUUID, bytecode)
} catch (error) {
  // Notify browser of failure
  // Log error
  // Retry if appropriate
}
```

### Message Reliability
For critical messages, confirm delivery:
```typescript
// Send message and wait for acknowledgment
const acknowledged = await waitForAck(message, timeout)
if (!acknowledged) {
  // Resend or fail
}
```

## Troubleshooting

**Device shows as offline but is powered on**
- Check WebSocket connection on device
- Verify device can reach server IP/port
- Check firewall allows WebSocket traffic
- Monitor device heartbeat messages

**Commands sent but device doesn't respond**
- Check message format matches protocol
- Verify device firmware version supports command
- Check device isn't in error state
- Review device logs

**Connection drops frequently**
- Increase heartbeat timeout if network is slow
- Check for network connectivity issues
- Monitor server resource usage
- Consider reducing ping interval

**"No active connection for Pip" error**
- Device not connected yet
- Device disconnected without notifying server
- Device ID mismatch
- Connection closed prematurely

## Best Practices

- **Always check connection exists** before sending messages
- **Use heartbeat messages** for health monitoring
- **Log all connection/disconnection events** for debugging
- **Handle disconnection gracefully** - notify browser, cleanup resources
- **Validate device ownership** - check user can control device
- **Implement timeouts** on command responses
- **Batch sensor data** to reduce message overhead
- **Clean up resources** on disconnect to prevent memory leaks
- **Test with actual hardware** before deployment
- **Monitor connection metrics** - count, duration, error rates

## Important Notes

- **WebSocket is persistent** - connections live until device power-off or network failure
- **Ping/pong is built-in** - provided by WebSocket protocol itself
- **Heartbeat is application-level** - custom protocol messages
- **Two channels allow scaling** - sensor data won't block commands
- **Device IDs must be unique** - enforced by database
- **Connection cleanup is critical** - prevents resource leaks
- **Protocol coordination** - device firmware and server must agree on message format
