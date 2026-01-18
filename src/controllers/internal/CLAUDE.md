# src/controllers/internal Directory - Claude Instructions

## Overview
This directory contains internal-only route handlers not exposed to normal clients. These endpoints are for administrative, debugging, and system operations. Requires special authentication/authorization.

## Key Files

### add-new-pip-uuid.ts
**Purpose:** Register new ESP32 device in system (admin only)

**Function:**
```typescript
async function addNewPipUUID(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Verify admin authorization
2. Extract device UUID from body
3. Validate UUID format
4. Register device in database
5. Initialize device metadata
6. Return success

**Request:**
```typescript
{
  pipUUID: string,
  deviceName?: string,
  firmwareVersion?: string
}
```

**Response:**
```typescript
{
  success: "",
  pipUUID: string,
  status: "registered"
}
```

### decode-email-subscriber.ts
**Purpose:** Decode/retrieve encrypted email subscriber data

**Function:**
```typescript
async function decodeEmailSubscriber(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract encoded email data
2. Decrypt using encryption key
3. Return decoded subscriber info
4. Only for internal use

**Request:**
```typescript
{
  encryptedData: string
}
```

**Response:**
```typescript
{
  email: string,
  subscribedAt: Date,
  category: string
}
```

### display-led-colors-directly.ts
**Purpose:** Send direct LED command to device (testing/debug)

**Function:**
```typescript
async function displayLedColorsDirectly(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Verify internal/test authorization
2. Extract pipUUID and color config
3. Send direct command to device
4. Used for hardware testing
5. Return command result

**Request:**
```typescript
{
  pipUUID: string,
  colors: { r: number, g: number, b: number }[]
}
```

**Response:**
```typescript
{
  success: "",
  devicesUpdated: number
}
```

### export-user-data.ts
**Purpose:** Export user data for compliance (GDPR/privacy)

**Function:**
```typescript
async function exportUserData(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract userId from params
2. Verify authorization
3. Gather all user data
4. Package in portable format (JSON)
5. Return for download

**Response:**
```typescript
// JSON file with all user data:
{
  user: { /* profile */ },
  projects: [ /* all projects */ ],
  submissions: [ /* code attempts */ ],
  chat: [ /* message history */ ],
  progress: [ /* learning progress */ ],
  settings: [ /* preferences */ ]
}
```

### delete-user-data.ts
**Purpose:** Perform complete user deletion (GDPR right to be forgotten)

**Function:**
```typescript
async function deleteUserData(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Verify user authorization (self or admin)
2. Archive data (for compliance)
3. Delete all user records
4. Anonymize references
5. Clear caches
6. Return success

**Request:**
```typescript
{
  userId: string,
  confirm: true
}
```

**Response:**
```typescript
{
  success: "",
  message: "User data deleted permanently"
}
```

### trigger-database-backup.ts
**Purpose:** Manually trigger database backup (ops only)

**Function:**
```typescript
async function triggerDatabaseBackup(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Verify ops/admin authorization
2. Trigger backup process
3. Monitor backup progress
4. Return backup info

**Response:**
```typescript
{
  backupId: string,
  status: "in_progress",
  startTime: Date,
  estimatedDuration: number
}
```

## Security & Authorization

### Access Control
- **Internal only** - Not accessible externally
- **API key required** - Special internal auth
- **IP whitelisting** - May restrict to internal IPs
- **Audit logging** - All accesses logged

### Authentication Types
- Internal API key
- Admin token
- Service account
- Operational credentials

## Database Operations

### Admin Operations
- Device registration
- User data exports
- User deletion
- System configuration

### Audit Logging
- All operations logged
- Timestamp and user tracked
- Action details recorded
- Compliance audit trail

## Error Handling

```typescript
// Unauthorized
401: { error: "Not authorized for this operation" }

// Invalid data
400: { error: "Invalid request data" }

// Not found
404: { error: "Resource not found" }

// Server error
500: { error: "Internal error" }
```

## Best Practices

- **Admin access only** - Strict authorization
- **Audit everything** - Complete logging
- **Soft deletes first** - Archive before delete
- **Double confirmation** - Critical operations
- **Rate limiting** - Prevent abuse
- **Error logging** - Capture all failures

## Common Operations

### Device Registration
```typescript
1. Physical device factory reset
2. Generates unique UUID
3. Sends registration request to server
4. POST /api/internal/register-device
5. Device registered in system
6. Ready for users to connect
```

### User Data Export
```typescript
1. User requests data export
2. Server triggers export job
3. GET /api/internal/export/:userId
4. All data compiled
5. JSON file generated
6. User downloads portable data
```

### User Deletion
```typescript
1. User requests account deletion
2. Confirmation required
3. DELETE /api/internal/users/:userId
4. All data archived
5. Records anonymized
6. Confirmation email sent
```

## Compliance Features

### GDPR Compliance
- Data export functionality
- Right to be forgotten (deletion)
- Consent tracking
- Privacy breach notification

### Data Retention
- Archive deleted data
- Audit trail preservation
- Compliance hold periods
- Legal retention requirements

## Important Notes

- **Internal access only** - Not for public API
- **Privileged operations** - Careful access control
- **Audit trail critical** - Must log everything
- **Backup strategy** - Regular backups essential
- **Compliance driven** - Legal requirements
- **Error handling robust** - Prevent data loss

## Integration with Other Systems

### Database Layer
- User data retrieval
- Backup coordination
- Archive storage

### Authentication Layer
- Internal API key validation
- Admin token verification
- Access control enforcement

### Logging Layer
- Comprehensive audit trail
- Compliance logging
- Error tracking

### External Services
- Backup storage (S3)
- Email notifications
- Monitoring alerts

### Type System
- Internal data structures
- Export format schemas
- Compliance type definitions
