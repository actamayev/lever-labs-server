# src/controllers/garage Directory - Claude Instructions

## Overview
This directory contains route handlers for the garage/device customization system. These controllers manage device display configuration (LEDs, sounds, balance settings).

## Key Files

### update-display.ts
**Purpose:** Update LED display configuration for connected device

**Function:**
```typescript
async function updateDisplay(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract userId and pipUUID from request
2. Verify device connected and online
3. Validate display configuration
4. Send display update command to ESP32
5. Save preference to database
6. Return success

**Request:**
```typescript
{
  pipUUID: string,
  displayConfig: {
    brightness: number,        // 0-255
    pattern: string,           // animation name
    color: { r: number, g: number, b: number }
  }
}
```

**Response:**
```typescript
{
  success: ""
}
```

### light-animation.ts
**Purpose:** Trigger animation sequence on device LEDs

**Function:**
```typescript
async function lightAnimation(req: Request, res: Response): Promise<void>
```

**Request:**
```typescript
{
  pipUUID: string,
  animationName: string,
  duration: number  // milliseconds
}
```

**Animation Types:**
```typescript
enum AnimationType {
  BREATHING = "breathing",
  PULSE = "pulse",
  RAINBOW = "rainbow",
  BLINK = "blink",
  CHASE = "chase"
}
```

### change-audible-status.ts
**Purpose:** Enable/disable device sounds and beeps

**Function:**
```typescript
async function changeAudibleStatus(req: Request, res: Response): Promise<void>
```

**Request:**
```typescript
{
  pipUUID: string,
  audibleEnabled: boolean
}
```

**Response:**
```typescript
{
  success: ""
}
```

### change-volume.ts
**Purpose:** Adjust device speaker volume

**Function:**
```typescript
async function changeVolume(req: Request, res: Response): Promise<void>
```

**Request:**
```typescript
{
  pipUUID: string,
  volume: number  // 0-100
}
```

**Response:**
```typescript
{
  success: ""
}
```

### change-balance-status.ts
**Purpose:** Enable/disable motor balance/stability features

**Function:**
```typescript
async function changeBalanceStatus(req: Request, res: Response): Promise<void>
```

**Request:**
```typescript
{
  pipUUID: string,
  balanceEnabled: boolean
}
```

**Response:**
```typescript
{
  success: ""
}
```

## Garage System Architecture

### Display Configuration
- LED patterns and animations
- Brightness levels
- Custom colors (RGB)
- Animation timing

### Sound Configuration
- Audio on/off toggle
- Volume control (0-100)
- Beep patterns
- Speaker management

### Motion Configuration
- Motor balance enabled/disabled
- Stability features
- Speed limiting
- Acceleration profiles

## Device Communication

### Message Types
- Display update commands
- Animation trigger messages
- Sound configuration
- Motor settings

### SendEsp32MessageManager
- Formats configuration into binary
- Sends via command WebSocket channel
- Device applies immediately
- Sends acknowledgment

## Database Operations

### Write
- `saveDisplayConfig(userId, pipUUID, config)` - Persist display
- `saveAudioConfig(userId, pipUUID, config)` - Persist audio
- `saveMotionConfig(userId, pipUUID, config)` - Persist motion

### Read
- `getDeviceConfig(pipUUID)` - Get current settings
- `getUserDeviceConfigs(userId)` - All configs

## Error Handling

```typescript
// Device not connected
400: { error: "Device not connected" }

// Invalid configuration
400: { error: "Invalid configuration value" }

// Device timeout
500: { error: "Device did not respond" }

// Server error
500: { error: "Internal Server Error: ..." }
```

## Validation

### Display Settings
- Brightness: 0-255
- Valid animation names only
- RGB values: 0-255 each

### Audio Settings
- Volume: 0-100
- Boolean toggle for enable

### Motion Settings
- Boolean toggle for balance
- Speed limits enforcement

## Integration Patterns

### Customization Workflow
```typescript
1. User opens device customization
2. Adjusts LED, sound, motion settings
3. Clicks "Apply"
4. POST /api/garage/[setting] with config
5. Server validates settings
6. Sends to device
7. Device applies immediately
8. Preference saved for later
9. UI confirms change
```

### Live Preview
```typescript
1. User changes setting
2. Real-time send to device
3. Device shows preview
4. User sees immediate feedback
5. Can continue adjusting
6. Saves when satisfied
```

## Real-time Features

### Immediate Feedback
- Device responds instantly
- UI shows current state
- No polling needed

### Animation Preview
- User sees animation on device
- Can switch animations quickly
- Timing configurable

## Best Practices

- **Validate all values** - Range checking
- **Handle device timeout** - Graceful error
- **Provide presets** - Common configurations
- **Save preferences** - Persist across sessions
- **Error feedback** - Clear user messages
- **Live preview** - Show changes immediately

## Common Workflows

### Changing LED Color
```typescript
1. User opens customization panel
2. Clicks color picker
3. Selects RGB values
4. Clicks "Apply"
5. POST /api/garage/display with config
6. Device LEDs change color
7. Returns success
8. UI confirms
```

### Playing Animation
```typescript
1. User selects animation from list
2. Chooses duration
3. Clicks "Play"
4. POST /api/garage/animation
5. Device plays animation
6. Can interrupt anytime
7. Loop or one-time configurable
```

### Adjusting Volume
```typescript
1. User opens sound settings
2. Moves volume slider
3. Device beeps at new volume
4. Confirms selection
5. PUT /api/garage/volume
6. Saved for future sessions
```

## Performance Considerations

- **Direct device control** - No polling
- **Cached preferences** - Quick recall
- **Batched updates** - Group changes
- **Low latency** - Real-time response needed

## Important Notes

- **Real-time only** - Requires connected device
- **Per-device settings** - Separate config per device
- **Persistent storage** - Survives power loss
- **Immediate effect** - No need to restart device
- **User preference** - Recalled on reconnection

## Integration with Other Systems

### ESP32 Integration
- Command formatting and sending
- Device communication via WebSocket
- Real-time response handling

### Database Layer
- Configuration persistence
- Per-user, per-device storage
- History tracking optional

### Authentication Layer
- User context required
- Device ownership verification

### Type System
- Strong typing of configs
- Enum for animation types
- Range validation

### Middleware Layer
- Authentication required
- Device connection verification
- Configuration validation
