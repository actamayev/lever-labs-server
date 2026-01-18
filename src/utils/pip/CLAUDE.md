# src/utils/pip Directory - Claude Instructions

## Overview
This directory contains utility functions for ESP32 device (pip/robot) management including connection state tracking, device UUID generation, and connection helpers. These utilities support device lifecycle management and real-time connection handling.

## Key Files

### auto-connect-to-pip.ts
**Purpose:** Automatically establish connection to a device on app startup

**Function:**
```typescript
async function autoConnectToPip(userId: string, lastPipUUID?: string): Promise<PipConnection>
```

**Usage:**
```typescript
import autoConnectToPip from "../../utils/pip/auto-connect-to-pip"

// On app load
const connection = await autoConnectToPip(userId)
if (connection) {
  console.log("Connected to device:", connection.pipUUID)
}
```

**Logic:**
1. Find last device user connected to (from previous session)
2. Check if device is currently online
3. If online, establish connection
4. If offline, await or try alternative devices
5. Update user session with connection

**Used by:** Browser socket connection handler on connect

### auto-connect-to-last-online-user.ts
**Purpose:** Track which user was last connected to a device

**Function:**
```typescript
function recordLastOnlineUser(pipUUID: string, userId: string): void
function getLastOnlineUser(pipUUID: string): string | null
```

**Usage:**
```typescript
import { recordLastOnlineUser, getLastOnlineUser } from "../../utils/pip/auto-connect-to-last-online-user"

// When device connects
recordLastOnlineUser(pipUUID, userId)

// When restarting
const lastUser = getLastOnlineUser(pipUUID)
if (lastUser) {
  notifyUserDeviceOnline(lastUser, pipUUID)
}
```

**Persistence:**
- Stored in database
- Updated each device connection
- Used for notification/reconnection

### get-currently-connected-pip-uuid.ts
**Purpose:** Get device UUID for currently connected user

**Function:**
```typescript
async function getCurrentlyConnectedPipUUID(userId: string): Promise<PipUUID | null>
```

**Usage:**
```typescript
import getCurrentlyConnectedPipUUID from "../../utils/pip/get-currently-connected-pip-uuid"

const pipUUID = await getCurrentlyConnectedPipUUID(userId)
if (pipUUID) {
  // User has connected device
}
```

**Query Logic:**
1. Check user's current session
2. Look up device UUID from session
3. Verify device still online
4. Return UUID or null

**Used by:** Controllers that need user's device without requiring it in request

### esp-connection-state-to-client-connection-status.ts
**Purpose:** Convert internal connection state to client-friendly status

**Function:**
```typescript
function espConnectionStateToClientStatus(espState: EspConnectionState): ClientConnectionStatus
```

**Connection States:**
```typescript
// Internal representation
type EspConnectionState =
  | "connected"
  | "disconnected"
  | "connecting"
  | "error"
  | "offline"

// Client representation
type ClientConnectionStatus = {
  isConnected: boolean
  status: "online" | "offline" | "connecting" | "error"
  pipUUID?: string
  lastSeen?: Date
  signal?: "strong" | "medium" | "weak"
}
```

**Usage:**
```typescript
import espConnectionStateToClientStatus from "../../utils/pip/esp-connection-state-to-client-connection-status"

const espState = esp32Manager.getConnectionState(pipUUID)
const clientStatus = espConnectionStateToClientStatus(espState)

socket.emit("deviceStatus", clientStatus)
```

**Translation Logic:**
```
ESP State          → Client Status
connected          → { isConnected: true, status: "online" }
connecting         → { isConnected: false, status: "connecting" }
disconnected       → { isConnected: false, status: "offline" }
error              → { isConnected: false, status: "error" }
```

### generate-pip-uuid.ts
**Purpose:** Generate unique UUIDs for new devices

**Function:**
```typescript
function generatePipUUID(): PipUUID
```

**Usage:**
```typescript
import generatePipUUID from "../../utils/pip/generate-pip-uuid"

const newPipUUID = generatePipUUID()
// Returns: "a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p"
```

**UUID Format:**
- Standard UUID v4 format
- Globally unique identifier
- Used as device identifier in WebSocket connections
- Stored in database `pip_uuid` table

**Device Registration:**
```typescript
// 1. Generate UUID
const pipUUID = generatePipUUID()

// 2. Register in database
await createPipUUID({
  pip_uuid: pipUUID,
  device_name: "Pip #1",
  firmware_version: "1.2.3"
})

// 3. Device connects with this UUID
// Device sends: x-pip-id: a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p
```

## Device Connection Lifecycle

**Connection Flow:**
```
Device Powers On
  ↓
Device Gets WiFi Connection
  ↓
Device Requests Server URL
  ↓
Device Connects WebSocket with x-pip-id header
  ↓
ESP32SocketManager Validates UUID
  ↓
SingleESP32Connection Created
  ↓
Device Online & Ready
  ↓
User Auto-Connects (if available)
```

**Disconnection Flow:**
```
Device Loses Power/Connection
  ↓
WebSocket Close Event Fires
  ↓
SingleESP32Connection Cleanup
  ↓
Device Removed from Active Map
  ↓
Browser Notified Device Offline
  ↓
LastOnlineUser Updated
```

## Connection State Management

### Checking Connection Status
```typescript
// Is device online?
const isOnline = esp32Manager.isPipUUIDConnected(pipUUID)

// Is user connected to device?
const isUserConnected = esp32Manager.getIsUserIdConnectedToOnlinePip(pipUUID, userId)

// Get all user's devices
const devices = await getUserConnectedDevices(userId)
```

### Real-time Status Updates
```typescript
// When device connects
esp32Manager.on("device-connected", (pipUUID, userId) => {
  // Update UI
  browserSocketManager.emitToUser(userId, "deviceConnected", pipUUID)
})

// When device disconnects
esp32Manager.on("device-disconnected", (pipUUID) => {
  // Notify users
  // Update last seen time
})
```

## Device Discovery & Connection

### Finding Available Devices
```typescript
// Get all online devices
const onlineDevices = esp32Manager.getOnlineDevices()

// Get user's paired devices
const userDevices = await getUserDevices(userId)
const availableDevices = userDevices.filter(d => onlineDevices.has(d.pipUUID))
```

### Connecting User to Device
```typescript
async function connectUserToDevice(userId, pipUUID) {
  // Check device exists
  const device = await getPipDevice(pipUUID)
  if (!device) throw new Error("Device not found")

  // Check device online
  if (!esp32Manager.isPipUUIDConnected(pipUUID)) {
    throw new Error("Device not online")
  }

  // Register connection
  recordLastOnlineUser(pipUUID, userId)

  // Notify client
  socket.emit("deviceConnected", pipUUID)
}
```

## Best Practices

### Connection Handling
- **Auto-reconnect** - Attempt to reconnect on disconnect
- **Notify user** - Show device status in UI
- **Handle timeouts** - Set reasonable timeouts for operations
- **Graceful degradation** - Allow operations without device
- **Retry logic** - Retry failed operations with backoff

### Device Management
- **Track last seen** - For offline devices
- **Validate UUIDs** - Check format and existence
- **Rate limit connections** - Prevent connection spam
- **Clean up stale** - Remove dead connections
- **Log events** - Track connection changes

### Performance
- **Cache status** - Don't query for every check
- **Batch updates** - Group connection changes
- **Minimize notifications** - Don't spam client
- **Use events** - Event-driven vs polling

## Integration Points

**With ESP32SocketManager:**
- Connection state queries
- Connection registry lookups
- Device online/offline events

**With BrowserSocketManager:**
- Emit device status to browser
- Listen for connection requests
- Broadcast device changes

**With Database:**
- Store device metadata
- Track last online users
- Persist connection history

## Troubleshooting

**Device always shows offline**
- Check device WiFi connection
- Verify device can reach server
- Check firewall allows WebSocket
- Review device logs for connection errors

**User can't find their device**
- Check device UUID in database
- Verify device is actually online
- Check user-device permissions
- Look for network issues

**Connection drops frequently**
- Check WiFi signal strength
- Review server load
- Check for network interruptions
- Monitor ping/heartbeat

**Can't auto-connect**
- Check last used device exists
- Verify device is online
- Check permissions haven't changed
- Review connection history

## Important Notes

- **UUIDs are immutable** - Once assigned, don't change
- **Connection state is ephemeral** - Updates frequently
- **Multiple users can view** - But only one active at a time
- **Devices can have multiple owners** - For classroom scenarios
- **Offline devices stay in database** - For history/tracking
- **Connection timeouts matter** - Set appropriate thresholds
- **WebSocket is persistent** - Connection lives until disconnect
