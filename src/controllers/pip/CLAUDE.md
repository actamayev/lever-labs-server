# src/controllers/pip Directory - Claude Instructions

## Overview
This directory contains route handlers for ESP32 device management. These controllers handle device connection/disconnection, status updates, and device control for robotics projects.

## Key Files

### client-connect-to-pip-request.ts
**Purpose:** Establish user connection to ESP32 device

**Function:**
```typescript
function clientConnectToPipRequest(req: Request, res: Response): void
```

**Workflow:**
1. Extract userId and pipUUID from request
2. Call `Esp32SocketManager.setOnlineUserConnected(pipUUID, userId)`
3. Handle result:
   - `false` = Serial connection active (can't connect)
   - `number` = Previous user ID (disconnect them first)
   - `true` = Success
4. Update browser socket manager with current device
5. Send device status message to ESP32
6. Return success

**Request:**
```typescript
{
  pipUUID: string  // Device identifier
}
```

**Response:**
```typescript
{
  success: ""
}
```

**Error Cases:**
```typescript
400: { message: "Unable to connect to Pip, serial connection is active" }
500: { error: "Internal Server Error: Unable to connect to Pip" }
```

**Key Logic:**
- Handles device hotswap (previous user disconnected)
- Broadcasts to previous user that device went offline
- Sends UserConnectedStatus.CONNECTED to device

### client-disconnect-from-pip-request.ts
**Purpose:** Disconnect user from ESP32 device

**Function:**
```typescript
function clientDisconnectFromPipRequest(req: Request, res: Response): void
```

**Workflow:**
1. Extract userId and pipUUID from request
2. Call `Esp32SocketManager.setOnlineUserDisconnected(userId, pipUUID)`
3. Update browser socket manager (remove device)
4. Send UserConnectedStatus.DISCONNECTED to device
5. Return success

**Request:**
```typescript
{
  pipUUID: string
}
```

**Response:**
```typescript
{
  success: ""
}
```

### pip-turning-off-serial-connection.ts
**Purpose:** Handle ESP32 device transitioning to serial mode

**Function:**
```typescript
async function pipTurningOffSerialConnection(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract pipUUID from request
2. Notify Esp32SocketManager that device going offline
3. Notify all connected users device is unavailable
4. Clean up state for that device
5. Return success

**Request:**
```typescript
{
  pipUUID: string
}
```

**Response:**
```typescript
{
  success: ""
}
```

**Use Case:**
- User plugs device into USB for serial programming
- Device firmware detects this mode
- Notifies server to disconnect all clients
- Clients get "device offline" notification
- Device goes into serial bootloader mode

### get-pip-status.ts
**Purpose:** Query current connection status of device

**Function:**
```typescript
async function getPipStatus(req: Request, res: Response): Promise<void>
```

**Response:**
```typescript
{
  pipUUID: string,
  isConnected: boolean,
  connectedUserId: string | null,
  lastHeartbeat: Date,
  status: "online" | "offline" | "serial_mode"
}
```

### get-user-connected-pip.ts
**Purpose:** Get currently connected device for authenticated user

**Function:**
```typescript
async function getUserConnectedPip(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract userId from request
2. Query device mapping for user
3. Check if device is still online
4. Return device info or null

**Response:**
```typescript
{
  pipUUID: string | null,
  deviceName: string | null,
  status: "connected" | "disconnected"
}
```

## Device Management Architecture

### Two WebSocket Channels
- **Command Channel**: User → device commands, device responses
- **Sensor Channel**: Device → real-time sensor data streams

### Connection Lifecycle
**Connect**: User clicks connect → POST /api/pip/connect → Device registered
**Active**: User controls device → Commands via command channel → Sensor data streams
**Disconnect**: User clicks disconnect → POST /api/pip/disconnect → State cleaned
**Serial Mode**: Device in USB bootloader → All users notified → Device marked offline

### Device Status
- **Online**: Connected and responsive
- **Offline**: Not responding (heartbeat timeout)
- **Serial Mode**: In bootloader/USB mode
- **Heartbeat**: Ping/pong every 750ms, timeout 3 seconds (2 missed pongs)

## Message Types

### Connection Messages
```typescript
{
  type: "user_connected",
  userId: string,
  timestamp: Date
}

{
  type: "user_disconnected",
  userId: string,
  timestamp: Date
}
```

### Status Messages
```typescript
{
  type: "device_status",
  status: DeviceStatus,
  pipUUID: string,
  timestamp: Date
}
```

### Serial Mode Message
```typescript
{
  type: "serial_mode_activated",
  pipUUID: string,
  timestamp: Date
}
```

## Database Operations

### Read
- `getCurrentlyConnectedPipUUID(userId)` - Get user's device
- `getDeviceStatus(pipUUID)` - Query device state
- User-device mapping lookups

### Write
- Connection records (may be transient)
- Device status updates
- Heartbeat/activity logging

## Real-time Communication

### WebSocket Events
- Connection status changes
- Device online/offline notifications
- Device list updates for UI

### Browser Socket Manager
- Emits device status to user
- Broadcasts device availability
- Handles disconnection notifications

## Error Handling

### Common Errors
```typescript
// Device not found
404: { error: "Device not found" }

// Device offline
400: { message: "Device is currently offline" }

// Serial connection active
400: { message: "Unable to connect to Pip, serial connection is active" }

// User already connected to device
400: { message: "Device already connected to another user" }

// Not connected to any device
400: { message: "User not connected to any device" }

// Server error
500: { error: "Internal Server Error: ..." }
```

## Integration Patterns

### Device Connection Flow
```typescript
// Route: POST /api/pip/connect
1. Validation middleware validates pipUUID
2. Authentication middleware verifies user
3. Controller receives request
4. Checks device online
5. Registers connection
6. Sends connection message to device
7. Returns success
8. Browser now ready to control device
```

### Device Disconnection Flow
```typescript
// Route: POST /api/pip/disconnect
1. Controller unregisters connection
2. Sends disconnection message
3. Cleans up browser mapping
4. Returns success
5. Browser returns to device list
```

### Status Query
```typescript
// Route: GET /api/pip/status/:pipUUID
1. Query device manager for status
2. Check heartbeat freshness
3. Return current status
4. UI updates device indicator
```

## Device Control Coordination

### Command Execution
```typescript
// User clicks "Move Forward"
1. Browser creates command message
2. SendEsp32MessageManager sends via command channel
3. Device receives and executes
4. Device sends acknowledgment
5. Sensor data streams on sensor channel
6. Browser displays real-time feedback
```

### Sensor Data Streaming
```typescript
// During active control
1. Device continuously sends sensor data
2. Browser receives on sensor channel
3. Real-time updates to UI (motor speeds, encoder, etc.)
4. No polling needed - push-based updates
```

## Best Practices

- **Always verify device online** - Check status before commands
- **Handle disconnections gracefully** - Notify user, clean state
- **Use heartbeats** - Detect dead connections quickly
- **Atomic operations** - Connect/disconnect should be atomic
- **Log device events** - Track for debugging
- **Clean up state** - Remove stale connections
- **Rate limit commands** - Prevent device overload

## Common Workflows

### Connecting to Device
User opens device list → Clicks "Connect" → POST /api/pip/connect → Device verified online → Connection registered → Device notified → UI shows "Connected"

### Sending Commands
User clicks control button → Command via command channel → Device executes → Sensor data streams → UI updates real-time

### Switching Devices
User connects Device B → Device A auto-disconnected → Device A user notified offline → UI controls Device B

### Device Offline Detection
Device unresponsive → Heartbeat timeout → Marked offline → Users notified → UI shows "Device Offline"

## Performance Considerations

- **Heartbeat frequency** - Balance responsiveness vs overhead
- **Message batching** - Group sensor updates if high frequency
- **Connection pooling** - Reuse WebSocket connections
- **Timeout values** - Adjust for network latency
- **Memory cleanup** - Remove old connection records

## Troubleshooting

**Device offline but actually online**: Check heartbeat timeout, network connectivity, firewall
**Can't connect to device**: Verify UUID, device online, no other user, not in serial mode
**Commands don't work**: Check device connected, command format, firmware version
**Slow sensor data**: Check network latency, streaming frequency, queue buildup

## Important Notes

- **Two-channel architecture** - Commands and data on separate WebSockets
- **One user per device** - Only single user can control at a time
- **Heartbeat critical** - Detects and cleans up dead connections
- **Serial mode conflicts** - Can't connect if device in USB mode
- **Stateful connections** - Server tracks all active connections
- **Real-time requirement** - Cannot operate over REST polling

## Integration with Other Systems

### Esp32SocketManager
- Core device connection tracking
- Heartbeat monitoring
- Status management

### BrowserSocketManager
- User connection tracking
- Real-time notifications
- Device status broadcasts

### SendEsp32MessageManager
- Command formatting and delivery
- Message queueing
- Retry logic

### Database Layer
- User-device relationship persistence
- Connection history (optional)
- Device status logging

### Middleware Layer
- Device UUID validation
- User authentication
- Connection verification
