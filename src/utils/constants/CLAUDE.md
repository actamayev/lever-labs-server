# src/utils/constants Directory - Claude Instructions

## Overview
This directory contains constant values and configuration used throughout the platform. These include application constants, event listener mappings, and static configuration values.

## Key Files

### constants.ts
**Purpose:** Central repository for application-wide constant values

**Example Constants:**
```typescript
// API configuration
export const API_VERSION = "v1"
export const API_BASE_PATH = "/api"

// Timeouts and intervals
export const SOCKET_TIMEOUT = 30000        // 30 seconds
export const HEARTBEAT_INTERVAL = 750      // 750ms
export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000  // 24 hours

// Device limits
export const MAX_CONNECTED_DEVICES = 10
export const MAX_CODE_LENGTH = 65535
export const MAX_PROJECT_NAME_LENGTH = 100

// Security
export const JWT_EXPIRY = "7d"
export const PASSWORD_MIN_LENGTH = 8
export const MAX_LOGIN_ATTEMPTS = 5

// Career/Challenge
export const NUM_CAREERS = 12
export const CHALLENGE_DIFFICULTY_LEVELS = ["easy", "medium", "hard"]

// LLM
export const LLM_MAX_TOKENS = 500
export const LLM_TEMPERATURE = 0.7
export const LLM_MESSAGE_HISTORY_LIMIT = 30
```

**Usage:**
```typescript
import {
  JWT_EXPIRY,
  SOCKET_TIMEOUT,
  MAX_CODE_LENGTH
} from "../../utils/constants"

// In middleware
const token = jwt.sign(payload, secret, { expiresIn: JWT_EXPIRY })

// In socket connection
socket.setTimeout(SOCKET_TIMEOUT)

// In validation
if (code.length > MAX_CODE_LENGTH) {
  throw new Error("Code too long")
}
```

### listeners-map.ts
**Purpose:** Map Socket.IO event names to handler functions

**Structure:**
```typescript
// Socket event listeners
export const SocketListeners = {
  // Browser socket events
  BROWSER: {
    SEND_CODE: "sendCode",
    SUBMIT_CHALLENGE: "submitChallenge",
    REQUEST_HINT: "requestHint",
    SEND_MESSAGE: "sendMessage",
    CONNECT: "connect",
    DISCONNECT: "disconnect",
    ERROR: "error"
  },

  // ESP32 socket events
  ESP32: {
    HEARTBEAT: "heartbeat",
    SENSOR_DATA: "sensorData",
    EXECUTION_COMPLETE: "executionComplete",
    ERROR: "error",
    CONNECT: "connect",
    DISCONNECT: "disconnect"
  }
}

// Event handlers mapping
export const EventHandlers = {
  "sendCode": handleSendCode,
  "submitChallenge": handleSubmitChallenge,
  "requestHint": handleRequestHint,
  "sensorData": handleSensorData,
  // ... more handlers
}
```

**Usage:**
```typescript
import { SocketListeners, EventHandlers } from "../../utils/constants/listeners-map"

// Register listener
socket.on(SocketListeners.BROWSER.SEND_CODE, (data) => {
  EventHandlers[SocketListeners.BROWSER.SEND_CODE](data)
})

// Emit event
socket.emit(SocketListeners.BROWSER.SEND_MESSAGE, message)
```

## Constants Organization

### By Category

**Configuration Constants:**
- API paths, versions, timeouts
- Environment-specific settings
- Feature flags

**Numeric Limits:**
- String lengths (code, names, etc.)
- Array sizes (history, connections)
- Resource limits (devices, storage)

**Time Constants:**
- Session durations
- Heartbeat intervals
- Request timeouts

**Domain Constants:**
- Career counts
- Difficulty levels
- Device modes

**Event Names:**
- Socket events
- Message types
- Handler names

## Using Constants Effectively

### Single Source of Truth
```typescript
// ✅ Good: Centralized constant
export const JWT_EXPIRY = "7d"

// Used everywhere
jwt.sign(payload, secret, { expiresIn: JWT_EXPIRY })

// ❌ Bad: Magic strings scattered
jwt.sign(payload, secret, { expiresIn: "7d" })
jwt.sign(payload2, secret, { expiresIn: "7d" })
jwt.sign(payload3, secret, { expiresIn: "7d" })
```

### Easy Configuration Changes
```typescript
// Before: Change required in 5 files
// After: Change in one place
export const MAX_ATTEMPTS = 5

// Now used everywhere consistently
// validateLoginAttempts(username, MAX_ATTEMPTS)
// checkRateLimit(user, MAX_ATTEMPTS)
// logFailedAttempt(user, MAX_ATTEMPTS)
```

### Enum-like Constants
```typescript
export const UserRoles = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student"
} as const

export type UserRole = typeof UserRoles[keyof typeof UserRoles]

// Usage
if (user.role === UserRoles.TEACHER) {
  // Show teacher options
}
```

### Flag Constants
```typescript
export const Features = {
  ENABLE_AI_HINTS: process.env.ENABLE_AI_HINTS === "true",
  ENABLE_MULTIPLAYER: process.env.ENABLE_MULTIPLAYER === "true",
  ENABLE_LEADERBOARD: process.env.ENABLE_LEADERBOARD === "true"
}

// Usage
if (Features.ENABLE_AI_HINTS) {
  socket.emit("hintAvailable", hintData)
}
```

## Best Practices

### Naming Conventions
```typescript
// ✅ Good: Clear, descriptive names
export const JWT_EXPIRY = "7d"
export const MAX_LOGIN_ATTEMPTS = 5
export const SOCKET_TIMEOUT_MS = 30000

// ❌ Bad: Unclear or ambiguous
export const EXP = "7d"
export const ATTEMPTS = 5
export const TIMEOUT = 30000
```

### Grouping Related Constants
```typescript
// ✅ Good: Related constants grouped
export const SessionConfig = {
  TIMEOUT: 24 * 60 * 60 * 1000,
  REFRESH_THRESHOLD: 60 * 60 * 1000,
  MAX_SESSIONS_PER_USER: 3
}

// ✅ Good: Feature-specific grouping
export const LLMConfig = {
  MAX_TOKENS: 500,
  TEMPERATURE: 0.7,
  HISTORY_LIMIT: 30
}
```

### Documentation
```typescript
// ✅ Good: Document the why
/** Maximum login attempts before account lockout (prevents brute force) */
export const MAX_LOGIN_ATTEMPTS = 5

/** JWT token expiry duration (balance security and UX) */
export const JWT_EXPIRY = "7d"

// ❌ Bad: No documentation
export const MAX_LOGIN_ATTEMPTS = 5
export const JWT_EXPIRY = "7d"
```

### Type Safety
```typescript
// ✅ Good: Typed constants
export const Difficulties = ["easy", "medium", "hard"] as const
export type Difficulty = typeof Difficulties[number]

// Usage - type safe
const difficulty: Difficulty = "easy"  // ✅
const difficulty2: Difficulty = "hard"  // ✅
const difficulty3: Difficulty = "invalid"  // ❌ Type error

// ❌ Less safe: String literal
const difficulty: string = "invalid"  // No error, wrong value allowed
```

## Adding New Constants

### When to Add
- Value used in multiple places
- Configuration that might change
- Domain-specific values
- Time/size limits

### Where to Add
```typescript
// Global application constants
// → constants.ts

// Socket event names
// → listeners-map.ts

// Feature-specific constants
// → src/utils/[feature]/constants.ts (if many)
```

### How to Add
1. Choose appropriate file
2. Add with clear name
3. Add JSDoc comment
4. Export for use
5. Update this documentation

## Integration Points

**With Configuration:**
- Load from environment
- Merge with defaults
- Validate values

**With Middleware:**
- Timeout enforcement
- Limit checking
- Rate limiting

**With Controllers:**
- Feature flags
- Resource limits
- Default values

**With Database:**
- Connection limits
- Query timeouts
- Cache durations

## Important Notes

- **Constants are immutable** - Use `as const` for type safety
- **Group logically** - Related constants together
- **Document the why** - Explain rationale with comments
- **Use throughout** - Don't duplicate values
- **Version your constants** - May change in future versions
- **Test with constants** - Verify limits are reasonable
- **Monitor usage** - Track if limits are too restrictive

## Troubleshooting

**Constant value seems wrong**
- Check if environment overrides it
- Verify it was updated globally
- Check for multiple definitions
- Review recent changes

**Limit too restrictive**
- Check real usage patterns
- Consider scaling requirements
- Update constant if needed
- Test new value thoroughly

**Performance affected**
- Check timeout values
- Verify limits allow realistic operations
- Profile with current constants
- Consider dynamic limits
