# src/middleware/confirm Directory - Claude Instructions

## Overview
This directory contains middleware that verifies resource existence and user permissions. "Confirm" middleware checks business logic preconditions after basic validation but before controllers execute. These ensure resources exist, user owns them, and operations are permitted.

## Pattern & Purpose

**Middleware Chain Order:**
1. **Validation** → Check request format (Joi)
2. **Authentication** → Verify user identity (JWT)
3. **Confirmation** → Check resource exists and user can access (this directory)
4. **Controller** → Execute business logic

**Key Difference from Validation:**
- **Validation**: Checks if request data is well-formed
- **Confirmation**: Checks if resources exist and user has permission

## Core Concepts

### Confirmation Pattern
```typescript
export default function confirmResourceExists(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // 1. Extract ID from request
    const { resourceId } = req.params

    // 2. Check resource exists
    const resource = database.find(resourceId)
    if (!resource) {
      res.status(404).json({ error: "Resource not found" })
      return
    }

    // 3. Check user permission (if needed)
    if (resource.ownerId !== req.user.id) {
      res.status(403).json({ error: "Forbidden" })
      return
    }

    // 4. Attach to request for controller
    req.resource = resource

    next()
  } catch (error) {
    res.status(500).json({ error: "Server error" })
  }
}
```

## Common Middleware Files

### Resource Existence Checks

**confirm-pip-is-active.ts**
- Verifies ESP32 device (pip) is currently connected
- Checks device online status
- Can optionally verify user is connected to device
- Usage:
  ```typescript
  router.post("/send-code",
    validateInput,
    jwtVerifyAttachUser,
    confirmPipIsActive(confirmUserConnectedToPip: true),
    controller
  )
  ```
- Returns 400 if device offline

**confirm-sandbox-project-exists-and-user-has-access.ts**
- Verifies sandbox project exists
- Confirms current user owns or has access to project
- Prevents users from accessing others' projects
- Returns 404 if not found, 403 if no access

**confirm-sandbox-project-exists-and-valid-user-id.ts**
- Similar to above but takes explicit user ID
- Used when user ID from token, params, or body
- Validates project exists for that user

**confirm-class-belongs-to-teacher.ts**
- Verifies class exists
- Confirms user is teacher of that class
- Prevents teachers from accessing other classes
- Used in teacher management endpoints

**confirm-hub-belongs-to-teacher.ts**
- Verifies hub/group exists
- Confirms teacher owns the hub
- Used for hub-specific operations

### Classroom Confirmation

**attach-classroom-id-attach-class-code.ts**
- Extracts classroom ID from request
- Validates classroom exists
- Attaches code/ID to request for controller
- Hybrid: attachment + confirmation

## Response Codes

Confirm middleware follows HTTP standards:

- **200/204** - Success, `next()` called
- **400** - Bad request (invalid input to confirm)
- **403** - Forbidden (user lacks permission)
- **404** - Not found (resource doesn't exist)
- **500** - Server error (database/system error)

## Usage Patterns

### Single Resource Check
```typescript
router.get("/projects/:projectId",
  jwtVerifyAttachUser,
  confirmProjectExists,
  getProjectController
)
```

### Multiple Permission Checks
```typescript
router.post("/challenges/:challengeId/submit",
  validateSubmission,
  jwtVerifyAttachUser,
  confirmChallengeExists,
  confirmUserEnrolledInChallenge,
  submitChallengeController
)
```

### Conditional Confirmation
```typescript
router.post("/resource",
  validateInput,
  jwtVerifyAttachUser,
  confirmPipIsActive(true),  // Parameter: require user connection
  controller
)
```

## Creating New Confirmation Middleware

### Step 1: Define Function Signature
```typescript
// Option A: Simple function
export default function confirmSomething(
  req: Request,
  res: Response,
  next: NextFunction
): void { }

// Option B: Factory function with parameters
export default function confirmSomething(requireExtra: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => { }
}
```

### Step 2: Implement Checks
```typescript
export default function confirmProjectExists(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { projectId } = req.params
    const { user } = req

    // Check resource exists
    const project = database.findProject(projectId)
    if (!project) {
      res.status(404).json({ message: "Project not found" })
      return
    }

    // Check permissions
    if (project.userId !== user.id) {
      res.status(403).json({ message: "Access denied" })
      return
    }

    // Attach to request
    req.project = project

    next()
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Server error" })
  }
}
```

### Step 3: Use in Route
```typescript
import confirmProjectExists from "../middleware/confirm/confirm-project-exists"

router.delete("/projects/:projectId",
  jwtVerifyAttachUser,
  confirmProjectExists,
  deleteProjectController
)
```

## Error Response Standards

### 404 Not Found
```typescript
res.status(404).json({
  message: "Project not found"
})
```

### 403 Forbidden
```typescript
res.status(403).json({
  message: "You don't have access to this project"
})
```

### 400 Bad Request
```typescript
res.status(400).json({
  message: "Pip device is not active"
})
```

## Common Patterns

### Ownership Verification
```typescript
if (resource.userId !== req.user.id) {
  res.status(403).json({ message: "Access denied" })
  return
}
```

### Multiple Ownership Types
```typescript
const isOwner = resource.userId === req.user.id
const isAdmin = req.user.role === "admin"
const isCollaborator = resource.collaborators.includes(req.user.id)

if (!isOwner && !isAdmin && !isCollaborator) {
  res.status(403).json({ message: "Access denied" })
  return
}
```

### Resource Status Check
```typescript
if (resource.status === "deleted") {
  res.status(404).json({ message: "Resource not found" })
  return
}

if (resource.status === "archived") {
  res.status(400).json({ message: "Resource is archived" })
  return
}
```

### Connection State Check
```typescript
const connected = deviceManager.isConnected(deviceId)
if (!connected) {
  res.status(400).json({ message: "Device is not connected" })
  return
}
```

## Database Operations in Middleware

### Safe Database Calls
```typescript
try {
  const project = await projectRepository.findById(projectId)
  if (!project) {
    res.status(404).json({ message: "Not found" })
    return
  }
} catch (error) {
  console.error("Database error:", error)
  res.status(500).json({ error: "Server error" })
  return
}
```

### Performance Considerations
- Cache frequently checked resources
- Use indexes on permission fields
- Avoid N+1 queries in middleware
- Keep database operations minimal

## Testing Confirmation Middleware

### Unit Test Example
```typescript
describe("confirmProjectExists", () => {
  it("should pass request to next if project found and owned by user", async () => {
    const req = {
      params: { projectId: "123" },
      user: { id: "user-1" }
    }
    const res = { status: jest.fn().returnThis(), json: jest.fn() }
    const next = jest.fn()

    // Mock database
    jest.mock("database", () => ({
      findProject: jest.fn().mockResolvedValue({
        id: "123",
        userId: "user-1"
      })
    }))

    await confirmProjectExists(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it("should return 404 if project not found", async () => {
    const req = { params: { projectId: "invalid" }, user: { id: "user-1" } }
    const res = { status: jest.fn().returnThis(), json: jest.fn() }
    const next = jest.fn()

    // Mock database returns null
    await confirmProjectExists(req, res, next)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})
```

## Important Notes

- **Always check permissions** - Don't assume authenticated user can access resource
- **Fail fast** - Return early on first failure
- **Clear error messages** - Help developers debug, be vague to users
- **Try-catch required** - Protect from database errors
- **Attach to request** - Make resource available to controller
- **Call next()** - Only when all checks pass
- **Log failures** - Track permission denials for security
- **Error codes matter** - 403 vs 404 has security implications
- **Database errors** - Map to 500, not 4xx
- **Resource state** - Consider soft-deletes, archives, etc.

## Troubleshooting

**Getting 403 when should be 404**
- Consider revealing if resource exists
- Use 404 for "not found for you"
- Use 403 for "forbidden" (only if you want to reveal existence)

**"Cannot read property on undefined"**
- Check middleware order (JWT before confirm)
- Verify `req.user` exists before accessing
- Add type guards

**Middleware not executing**
- Check route definition syntax
- Verify middleware imported
- Check order in middleware chain
- Ensure no middleware returns without calling next()

**Performance issues**
- Database queries too slow
- N+1 problem: fetching related data
- Use caching for frequently checked resources
- Consider batch loading in middleware
