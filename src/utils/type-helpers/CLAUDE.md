# src/utils/type-helpers Directory - Claude Instructions

## Overview
This directory contains TypeScript type checking utilities and type guards. These utilities help verify data types at runtime, validate domain-specific types (UUIDs, device IDs), and provide safe type narrowing for TypeScript code.

## Key Files

### type-checks.ts
**Purpose:** Runtime type validation functions

**Common Type Checks:**
```typescript
// UUID validation
isPipUUID(value: unknown): value is PipUUID
isValidUUID(value: string): boolean

// Email validation
isValidEmail(email: string): boolean

// ID validation
isValidUserId(id: string): boolean

// Array/Object checks
isArray(value: unknown): value is any[]
isObject(value: unknown): value is Record<string, unknown>

// String checks
isNonEmptyString(value: unknown): value is string
```

**Usage:**
```typescript
import isPipUUID from "../../utils/type-helpers/type-checks"

if (isPipUUID(value)) {
  // TypeScript knows value is PipUUID type
  const connection = esp32Manager.getConnection(value)
}
```

**Type Guard Pattern:**
```typescript
function isPipUUID(value: unknown): value is PipUUID {
  // Check if value is a string
  if (typeof value !== "string") return false

  // Check if matches UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}
```

**Type Guard Benefits:**
- Runtime validation of types
- Type narrowing in if blocks
- Prevents type errors
- Self-documenting code

### type-guards.ts
**Purpose:** Advanced type guard utilities

**Functions:**
```typescript
// Object property checks
hasProperty<K extends PropertyKey>(obj: unknown, key: K): obj is Record<K, unknown>

// Array element type checks
isArrayOf<T>(value: unknown, typeGuard: (v: unknown) => v is T): value is T[]

// Union type checks
isOneOf<T>(value: unknown, options: T[]): value is T

// Optional checks
isNonNull<T>(value: T | null | undefined): value is T

// Custom domain checks
isCareerData(value: unknown): value is CareerData
isChallengeData(value: unknown): value is ChallengeData
```

**Usage:**
```typescript
import { hasProperty, isArrayOf } from "../../utils/type-helpers/type-guards"

// Check object has property
if (hasProperty(obj, "email")) {
  // obj.email is now known to exist
  console.log(obj.email)
}

// Check array of strings
if (isArrayOf(value, (v): v is string => typeof v === "string")) {
  // value is now string[]
  value.forEach(s => console.log(s.toUpperCase()))
}
```

## Type Guard Patterns

### Simple Type Check
```typescript
function isString(value: unknown): value is string {
  return typeof value === "string"
}

// Usage
if (isString(value)) {
  value.toUpperCase()  // TypeScript knows it's safe
}
```

### Domain-Specific Type Guard
```typescript
interface User {
  id: string
  email: string
  name: string
}

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "email" in value &&
    "name" in value &&
    typeof (value as any).id === "string" &&
    typeof (value as any).email === "string" &&
    typeof (value as any).name === "string"
  )
}
```

### Composable Guards
```typescript
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(item => typeof item === "string")
  )
}

function isOptional<T>(guard: (v: unknown) => v is T) {
  return (value: unknown): value is T | undefined => {
    return value === undefined || guard(value)
  }
}
```

## Common Use Cases

### Validating Request Data
```typescript
import isPipUUID from "../../utils/type-helpers/type-checks"

function validateRequest(body: unknown) {
  if (!isPipUUID(body.pipUUID)) {
    throw new Error("Invalid device ID format")
  }
  // Now safely use body.pipUUID as PipUUID type
}
```

### Safe Array Operations
```typescript
import { isArrayOf } from "../../utils/type-helpers/type-guards"

function processUserIds(data: unknown[]) {
  if (isArrayOf(data, (v): v is string => typeof v === "string")) {
    // Safely iterate knowing each element is string
    data.forEach(id => processId(id))
  }
}
```

### Database Result Validation
```typescript
import isUser from "../../utils/type-helpers/type-guards"

async function getUser(id: string) {
  const result = await database.query("SELECT * FROM users WHERE id = ?", [id])

  if (isUser(result)) {
    return result  // TypeScript knows it's User type
  }

  throw new Error("Invalid user data from database")
}
```

### API Response Validation
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

function isSuccessResponse<T>(
  response: unknown,
  dataGuard: (v: unknown) => v is T
): response is ApiResponse<T> & { data: T } {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    (response as any).success === true &&
    "data" in response &&
    dataGuard((response as any).data)
  )
}
```

## Best Practices

### Creating Type Guards
```typescript
// ✅ Good: Clear, focused, reusable
function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && value > 0
}

// ❌ Bad: Too specific, not reusable
const isUserIdNumber = (x: any) => typeof x === "number" && x > 0 && x < 999999
```

### Using Type Assertions Carefully
```typescript
// ✅ Good: Type guard provides safety
if (isPipUUID(value)) {
  const uuid: PipUUID = value  // No assertion needed
}

// ❌ Risky: Assertion bypasses safety
const uuid = value as PipUUID  // Unsafe! Not validated
```

### Combining Guards
```typescript
// ✅ Composable and reusable
const isUserArray = (v: unknown): v is User[] =>
  Array.isArray(v) && v.every(isUser)

// ✅ Optional values
const isOptionalUser = (v: unknown): v is User | undefined =>
  v === undefined || isUser(v)
```

## Integration Patterns

### With Middleware
```typescript
// Validation middleware
function validateRequest(req, res, next) {
  if (!isPipUUID(req.body.pipUUID)) {
    return res.status(400).json({ error: "Invalid device ID" })
  }
  next()
}
```

### With Controllers
```typescript
// Safe type narrowing in controller
export default async function controller(req, res) {
  if (isPipUUID(req.body.deviceId)) {
    const device = await getDevice(req.body.deviceId)
    res.json(device)
  } else {
    res.status(400).json({ error: "Invalid device ID" })
  }
}
```

### With Database Operations
```typescript
// Validate database results
async function findUser(id: string) {
  const result = await db.query("SELECT * FROM users WHERE id = ?", [id])

  if (!isUser(result)) {
    throw new Error("Unexpected database format")
  }

  return result
}
```

## Advanced Patterns

### Conditional Type Guards
```typescript
type RequestBody = { type: "user"; data: User } | { type: "device"; data: Device }

function isUserRequest(req: RequestBody): req is { type: "user"; data: User } {
  return req.type === "user" && isUser(req.data)
}
```

### Discriminated Unions
```typescript
type Result =
  | { status: "success"; data: string }
  | { status: "error"; error: Error }

function isSuccess(result: Result): result is { status: "success"; data: string } {
  return result.status === "success"
}
```

### Generic Type Guards
```typescript
function isInstanceOf<T extends new (...args: any[]) => any>(
  ctor: T
): (value: unknown) => value is InstanceType<T> {
  return (value: unknown): value is InstanceType<T> =>
    value instanceof ctor
}
```

## Testing Type Guards

```typescript
describe("type guards", () => {
  describe("isPipUUID", () => {
    it("should accept valid UUID", () => {
      const uuid = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
      expect(isPipUUID(uuid)).toBe(true)
    })

    it("should reject invalid UUID", () => {
      expect(isPipUUID("not-a-uuid")).toBe(false)
      expect(isPipUUID(123)).toBe(false)
      expect(isPipUUID(null)).toBe(false)
    })

    it("should narrow type in if block", () => {
      const value: unknown = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
      if (isPipUUID(value)) {
        // TypeScript knows value is PipUUID
        const safe: PipUUID = value
      }
    })
  })
})
```

## Important Notes

- **Type guards are runtime checks** - TypeScript removes them in compiled output
- **Always validate at boundaries** - API inputs, database results, external data
- **Combine guards for complex types** - Build up from simpler guards
- **Never trust `as` assertions** - Type guards are better
- **Document guard behavior** - Especially for domain-specific types
- **Keep guards focused** - One responsibility per guard
- **Reuse guards** - Extract common patterns
- **Performance matters** - Guards run at runtime
- **Test thoroughly** - Guards are security-critical

## Troubleshooting

**Type still shows as `unknown` after guard**
- Ensure guard returns proper type predicate
- Check guard condition is complete
- Verify TypeScript version supports type guards

**Guard always returns false**
- Check logic is correct
- Verify test data matches expectations
- Debug by logging intermediate values

**Guard too permissive**
- Add more validation checks
- Check all required properties
- Test edge cases (null, undefined, etc.)

**Guard too restrictive**
- Review business requirements
- Consider optional vs required fields
- Check for version compatibility
