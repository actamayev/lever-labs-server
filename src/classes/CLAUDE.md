# src/classes Directory - Claude Instructions

## Overview
This directory contains singleton service classes that manage critical application infrastructure. These are long-lived, stateful services that maintain single instances throughout the application lifetime. Classes handle database connections, cloud services, real-time communication, and external integrations.

## Singleton Pattern

All classes in this directory follow the **Singleton pattern** - a single instance is created and reused globally.

**Base Class: Singleton**
```typescript
// singleton.ts
export default abstract class Singleton {
  protected static instance: any | null = null
  protected readonly region: string = "us-east-1"

  protected constructor() {}

  public static getInstance(): any {
    throw new Error("getInstance method must be implemented in the subclass")
  }
}
```

**Pattern Benefits:**
- Single instance prevents duplicate connections (DB, Socket, etc.)
- Memory efficient - no recreation on each use
- Centralized state management
- Easy to mock for testing

## Core Services

### Database & Persistence

**PrismaClientClass** (`prisma-client.ts`)
- Single PostgreSQL connection via Prisma ORM
- Lazy initialization on first use
- Retrieves connection string from AWS Secrets Manager
- Usage:
  ```typescript
  const prisma = await PrismaClientClass.getPrismaClient()
  const user = await prisma.users.findUnique({ where: { id: 1 } })
  ```
- **Never create multiple instances** - always use `getPrismaClient()`

**MongoClientClass** (`mongo-client-class.ts`)
- MongoDB connection for non-relational data
- Singleton pattern for connection reuse
- Manages connection pooling
- Used for specific features requiring document storage

### Real-Time Communication

**BrowserSocketManager** (`browser-socket-manager.ts`)
- Manages all browser/client WebSocket connections
- Socket.IO server for real-time browser communication
- Maintains connection state for all users
- Features:
  - User session tracking
  - Event broadcasting to connected clients
  - Room management for targeted messaging
  - Disconnect handling and cleanup
- Key methods:
  - `getInstance()` - Get singleton manager
  - `emitToUser(userId, event, data)` - Send to specific user
  - `broadcastEvent(event, data)` - Send to all connected clients

**ESP32SocketManager** (`esp32/esp32-socket-manager.ts`)
- Manages connections from ESP32 microcontrollers
- Separate from browser connections
- Handles device-specific communication protocol
- Features:
  - Device registration and tracking
  - Connection state per device
  - Message routing to devices
  - Firmware update orchestration
- Key classes:
  - `SingleEsp32Connection` - Individual device connection state
  - `SendEsp32MessageManager` - Outbound message handling

**HubManager** (`hub-manager.ts`)
- Central routing hub for all real-time events
- Coordinates between browser sockets and ESP32 sockets
- Event distribution logic
- Maintains overall application state
- Used for cross-system communication (browser ↔ device)

**ScoreboardManager** (`scoreboard-manager.ts`)
- Manages real-time scoring and leaderboard updates
- Broadcasts score changes to all connected clients
- Maintains running scoreboard state
- Updates via Socket.IO events

**StreamManager** (`stream-manager.ts`)
- Manages real-time streaming of data (sensor readings, logs, etc.)
- Coordinates streaming protocols
- Buffers and batches stream data for efficiency

### Cloud Services (AWS)

**aws/SecretsManager** (`aws/secrets-manager.ts`)
- Manages secrets from AWS Secrets Manager
- Singleton retrieves and caches secrets securely
- Never exposes secrets in logs or error messages
- Usage:
  ```typescript
  const apiKey = await SecretsManager.getInstance().getSecret("OPENAI_API_KEY")
  const dbUrl = await SecretsManager.getInstance().getSecret("DATABASE_URL")
  ```
- **Never hardcode secrets** - always use SecretsManager

**aws/S3Manager** (`aws/s3-manager.ts`)
- Manages file uploads and downloads to AWS S3
- Handles file storage for user projects, media, etc.
- Provides signed URLs for secure file access
- Features:
  - Upload files to S3
  - Generate download URLs
  - Delete files
  - List bucket contents

### External Integrations

**OpenAIClient** (`openai-client.ts`)
- Integration with OpenAI API
- Manages API requests for educational chat features
- Handles streaming responses
- Usage:
  ```typescript
  const openai = OpenAIClient.getInstance()
  const response = await openai.createMessage(prompt)
  ```

### Utilities

**Encryptor** (`encryptor.ts`)
- Encryption/decryption utilities for sensitive data
- Uses secure algorithms
- Singleton pattern for key management
- Usage:
  ```typescript
  const encrypted = Encryptor.getInstance().encrypt(data)
  const decrypted = Encryptor.getInstance().decrypt(encrypted)
  ```

**Hash** (`hash.ts`)
- Hashing utilities for passwords and data
- One-way hash functions (bcrypt, etc.)
- Never used for encryption (hashing is one-directional)

## ESP32 Hardware Integration

### Directory: esp32/

**esp32-socket-manager.ts**
- Main manager for all ESP32 connections
- Routes messages from/to devices
- Tracks device state and health
- Coordinates firmware updates

**single-esp32-connection.ts**
- Represents a single device connection
- Maintains connection state
- Handles device-specific message protocols

**send-esp32-message-manager.ts**
- Outbound message handling for devices
- Formats and sends commands to ESP32s
- Manages message queuing and delivery

**esp-latest-firmware-manager.ts**
- Manages firmware version updates
- Coordinates Over-The-Air (OTA) updates
- Tracks available firmware versions

## Using Singleton Classes

### Pattern for Accessing Services

```typescript
// Import the class
import PrismaClientClass from "../classes/prisma-client"

// Get singleton instance
const prisma = await PrismaClientClass.getPrismaClient()

// Use the service
const user = await prisma.users.findUnique({ where: { id: userId } })
```

### Async Initialization

Some services require async initialization:
```typescript
// These require await
const prisma = await PrismaClientClass.getPrismaClient()
const secret = await SecretsManager.getInstance().getSecret("KEY")

// These are synchronous
const browserSockets = BrowserSocketManager.getInstance()
const espSockets = ESP32SocketManager.getInstance()
```

### Dependency Injection in Services

Controllers and other services depend on singleton classes:
```typescript
// In a controller
export default async function userController(req: Request, res: Response) {
  const prisma = await PrismaClientClass.getPrismaClient()
  const user = await prisma.users.findUnique(...)
  res.json(user)
}
```

## Creating New Singleton Services

### Step 1: Extend Singleton Base Class
```typescript
// src/classes/my-service.ts
import Singleton from "./singleton"

export default class MyService extends Singleton {
  private serviceInstance: any

  private constructor() {
    super()
  }

  public static async getInstance(): Promise<MyService> {
    if (!this.instance) {
      this.instance = new MyService()
      await this.instance.initialize()
    }
    return this.instance
  }

  private async initialize(): Promise<void> {
    // Initialize service connections, etc.
  }

  public async doSomething(): Promise<any> {
    // Service methods
  }
}
```

### Step 2: Use in Application
```typescript
// In any controller or service
import MyService from "../classes/my-service"

const service = await MyService.getInstance()
await service.doSomething()
```

## Important Patterns

### Thread Safety
Singleton instances are created once and reused - ensure thread-safe operations:
- Use locks for concurrent access if needed
- Prisma client handles concurrent queries safely
- Socket managers use event-driven architecture

### Error Handling
Service initialization errors should be caught early:
```typescript
try {
  const prisma = await PrismaClientClass.getPrismaClient()
} catch (error) {
  console.error("Database connection failed:", error)
  // Fail fast - don't continue with bad connection
  process.exit(1)
}
```

### Service Dependencies
Services may depend on other singletons:
```typescript
// PrismaClientClass depends on SecretsManager
// ESP32SocketManager depends on BrowserSocketManager for coordination
// Document these dependencies clearly
```

### Testing Mocks
For unit testing, mock singleton instances:
```typescript
jest.mock("../classes/prisma-client", () => ({
  getPrismaClient: jest.fn().mockResolvedValue({
    users: { findUnique: jest.fn() }
  })
}))
```

## Best Practices

- **Lazy initialization** - Create services only when first used
- **Error handling** - Fail fast on initialization errors
- **Logging** - Log service initialization and major operations
- **No state pollution** - Services shouldn't share mutable state with other systems
- **Type safety** - Always type service methods and return values
- **Resource cleanup** - Implement cleanup methods for services with connections
- **Document dependencies** - Clearly note which services depend on others
- **Never instantiate directly** - Always use `getInstance()` or `getPrismaClient()`

## Troubleshooting

**"Cannot read property 'getInstance' of undefined"**
- Service class not imported correctly
- Check import path and file name
- Verify class exports default

**Database connection fails at startup**
- Verify DATABASE_URL secret exists in AWS Secrets Manager
- Check network connectivity to RDS
- Ensure security groups allow connection from server

**Socket connections not working**
- Verify Socket.IO is initialized in main app (index.ts)
- Check browser can reach WebSocket endpoint
- Review Socket.IO middleware for auth issues

**Service memory leak**
- Check if connections are properly closed on shutdown
- Verify no circular references between services
- Monitor memory usage with `pm2 monit`

## Important Notes

- **Production stability depends on singletons** - A failed service can crash the app
- **Never create multiple instances** - Always use the getter method
- **Services are global state** - Tests may interfere if not properly mocked
- **Initialization order matters** - Some services depend on others
- **Secrets are secure** - Use SecretsManager for all sensitive data
- **Connection pooling** - Reusing connections improves performance significantly
