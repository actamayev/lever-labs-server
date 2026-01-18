# src/utils/generate Directory - Claude Instructions

## Overview
This directory contains utility functions for generating unique identifiers and codes used throughout the platform. These generators create classroom codes, device UUIDs, and other identifiers needed for system operations.

## Key Files

### generate-classroom-code.ts
**Purpose:** Generate unique access codes for classrooms

**Function:**
```typescript
function generateClassroomCode(): string
```

**Output Format:**
```
6 alphanumeric characters
Example: "ABC123"
```

**Usage:**
```typescript
import generateClassroomCode from "../../utils/generate/generate-classroom-code"

const classCode = generateClassroomCode()
// Returns: "XYZ789"

const classroom = await createClassroom({
  teacherId: user.id,
  className: "Robotics 101",
  accessCode: classCode
})

// Students use code to join:
// POST /api/classroom/join { code: "XYZ789" }
```

**Code Generation:**
- Generates random 6-character code
- Uses uppercase letters + numbers
- Ensures uniqueness (checks database)
- Excludes confusing characters (0 vs O, 1 vs I, etc.)

**Database Check:**
```typescript
async function generateClassroomCode(): Promise<string> {
  let code: string
  let exists = true

  while (exists) {
    code = generateRandomCode()  // 6 chars
    exists = await codeExists(code)
  }

  return code
}
```

### generate-pip-uuid.ts
**Purpose:** Generate unique UUIDs for new ESP32 devices

**Function:**
```typescript
function generatePipUUID(): PipUUID
```

**Output Format:**
```
UUID v4 format
Example: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
```

**Usage:**
```typescript
import generatePipUUID from "../../utils/generate/generate-pip-uuid"

const deviceUUID = generatePipUUID()
// Returns: "f7g8h9i0-j1k2-4l3m-8n9o-p0q1r2s3t4u5"

const device = await registerDevice({
  pipUUID: deviceUUID,
  deviceName: "Pip #1",
  firmware: "1.2.3"
})
```

**Device Registration Flow:**
1. New device powers on
2. Server generates UUID for device
3. UUID stored in database
4. Device sends UUID in WebSocket header
5. Server validates UUID matches registered device

## Generator Patterns

### Collision Avoidance
```typescript
// Check uniqueness before returning
async function generateUniqueCode<T extends { code: string }>(
  generator: () => string,
  validator: (code: string) => Promise<boolean>,
  maxAttempts: number = 100
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generator()
    const exists = await validator(code)

    if (!exists) {
      return code
    }
  }

  throw new Error("Failed to generate unique code after max attempts")
}
```

### Format Validation
```typescript
function isValidClassCode(code: string): boolean {
  // 6 chars, uppercase letters + numbers
  return /^[A-Z0-9]{6}$/.test(code)
}

function isValidPipUUID(uuid: string): boolean {
  // UUID v4 format
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)
}
```

## Usage Patterns

### Classroom Creation
```typescript
async function createClassroom(teacher, name) {
  // 1. Generate unique code
  const code = await generateClassroomCode()

  // 2. Create classroom
  const classroom = await db.classrooms.create({
    teacherId: teacher.id,
    className: name,
    accessCode: code,
    createdAt: new Date()
  })

  // 3. Return to teacher
  return {
    id: classroom.id,
    name: classroom.className,
    code: code  // Teacher shares with students
  }
}
```

### Device Registration
```typescript
async function registerNewDevice(owner, deviceName) {
  // 1. Generate unique UUID
  const uuid = generatePipUUID()

  // 2. Register device
  const device = await db.devices.create({
    pipUUID: uuid,
    deviceName: deviceName,
    ownerId: owner.id,
    registeredAt: new Date(),
    online: false
  })

  // 3. Return UUID to device (via QR code or manual entry)
  return { uuid, deviceName }
}
```

## Best Practices

### Generation Strategy
- **Use cryptographic randomness** - Not predictable
- **Check for collisions** - Verify uniqueness
- **Readable format** - Easy for users to type/remember
- **Case sensitivity** - Be consistent (uppercase vs mixed)
- **Version your format** - Allow future changes

### Performance
```typescript
// ✅ Good: Cache available codes
const codeCache = new Set<string>()

async function generateCode() {
  if (codeCache.size === 0) {
    // Refill cache
    const newCodes = generateBatch(100)
    newCodes.forEach(c => codeCache.add(c))
  }

  return codeCache.pop()!
}

// ❌ Inefficient: Database query for every code
async function generateCodeBad() {
  let exists = true
  while (exists) {
    const code = Math.random().toString(36).slice(2, 8)
    exists = await codeExists(code)
  }
  return code
}
```

### Testing Generated Values
```typescript
describe("generateClassroomCode", () => {
  it("should generate 6-character codes", () => {
    const code = generateClassroomCode()
    expect(code).toHaveLength(6)
    expect(/^[A-Z0-9]{6}$/.test(code)).toBe(true)
  })

  it("should generate unique codes", () => {
    const codes = new Set()
    for (let i = 0; i < 100; i++) {
      codes.add(generateClassroomCode())
    }
    expect(codes.size).toBe(100)  // All unique
  })

  it("should not generate confusing characters", () => {
    const code = generateClassroomCode()
    expect(code).not.toMatch(/[OI01l]/i)
  })
})
```

## Important Notes

- **Never reuse IDs** - Once generated and assigned, don't reuse
- **Store immediately** - Save generated codes before returning
- **Validate format** - Always check generated values
- **Document format** - Make format clear for users
- **Plan for scale** - Consider collision probability as system grows
- **Use existing standards** - UUID v4 is widely supported
- **Performance matters** - Collision checking can be slow
- **Security considerations** - Randomness should be cryptographically secure

## Troubleshooting

**Collision detected**
- Check uniqueness validation
- Verify database queries are correct
- Monitor collision rate
- Consider using larger code space

**Generation fails**
- Check random number generator
- Verify database connection
- Review timeout settings
- Check collision check logic

**Performance degradation**
- Consider pre-generating codes
- Implement caching strategy
- Batch database checks
- Monitor collision rates
