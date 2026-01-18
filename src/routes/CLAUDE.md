# src/routes Directory - Claude Instructions

## Overview
This directory contains Express route definitions organized by feature area. Each route file defines HTTP endpoints and wires together middleware, validation, and controllers. Routes are modular, allowing independent feature development and clear separation of concerns.

## Route Files Organization

### Core Feature Routes

**auth-routes.ts**
- POST `/login` - User login with credentials
- POST `/logout` - Clear user session
- POST `/register` - New user registration
- POST `/register-google-info` - Store Google OAuth user info (requires JWT)
- POST `/google-auth/login-callback` - Handle Google OAuth callback

**sandbox-routes.ts**
- Sandbox coding project management and execution
- CRUD operations: create, read, update, delete projects
- Code compilation and execution (USB and WiFi)
- Project sharing and search functionality
- ~40+ related endpoints for sandbox workflow

**career-quest-routes.ts**
- Career quest progression and completion
- Chat interactions for career guidance
- Career selection and tracking

**quest-routes.ts**
- Challenge quest management
- Challenge completion tracking
- Quest progression endpoints

**chat-routes.ts**
- Chat message endpoints across all chat systems
- Career quest chat
- Challenge chat
- Sandbox project chat
- Message history and streaming

**pip-routes.ts**
- ESP32 device (pip/robot) management
- Device registration and connection
- Device telemetry and status
- Firmware update endpoints

**personal-info-routes.ts**
- User profile information management
- User settings and preferences
- Personal data updates

**student-routes.ts**
- Student-specific endpoints
- Student dashboard and progress
- Class/group management

**garage-routes.ts**
- Equipment and garage management
- Vehicle/device inventory endpoints

**arcade-routes.ts**
- Arcade/game mode endpoints
- Game state and scoring

**workbench-routes.ts**
- Workbench environment endpoints
- Development tool integration

**misc-routes.ts**
- Health check and utility endpoints
- Server status and diagnostics

**internal-routes.ts**
- Internal-only endpoints (not exposed to clients)
- Admin operations and maintenance

### Teacher Routes Subdirectory

**teacher/** - Specialized routes for teacher/educator functionality
- Class management
- Student progress tracking
- Assignment creation and distribution
- Grade management

## Route Structure Pattern

All routes follow a consistent pattern:

```typescript
import express from "express"

// Import middleware (validation, auth, confirmation)
import validateSomething from "../middleware/request-validation/[feature]/..."
import jwtVerifyAttachUser from "../middleware/jwt/..."
import confirmSomethingExists from "../middleware/confirm/..."

// Import controllers
import getEndpoint from "../controllers/[feature]/..."
import postEndpoint from "../controllers/[feature]/..."

const featureRoutes = express.Router()

// Define routes with middleware pipeline
featureRoutes.get("/endpoint", validateSomething, jwtVerifyAttachUser, getEndpoint)
featureRoutes.post("/endpoint", validateSomething, jwtVerifyAttachUser, postEndpoint)

export default featureRoutes
```

## Middleware Pipeline

Routes use a middleware chain to process requests:

1. **Validation Middleware** - Validates request body/params/query
   - Location: `src/middleware/request-validation/[feature]/`
   - Checks data shape and types using Joi schemas
   - Runs first, rejects invalid requests early

2. **Authentication Middleware** - Verifies JWT and attaches user
   - Location: `src/middleware/jwt/`
   - `jwtVerifyAttachUser` - Requires valid JWT token
   - `jwtOptional` - JWT is optional for public endpoints

3. **Confirmation Middleware** - Checks resource existence and permissions
   - Location: `src/middleware/confirm/`
   - `confirmUserConnectedToPip` - User has active device connection
   - `confirmSandboxProjectExists` - Project exists in database
   - Prevents business logic errors before controllers run

4. **Transformation Middleware** - Converts or prepares data
   - Location: `src/middleware/`
   - `convertCppToBytecode` - Compiles C++ to bytecode
   - Custom per-endpoint transformations

5. **Controller** - Handles the actual business logic
   - Location: `src/controllers/[feature]/`
   - Returns response to client

## Adding New Routes

### Step 1: Create Validation Middleware
```typescript
// src/middleware/request-validation/[feature]/validate-[endpoint].ts
import Joi from "joi"
import { Request, Response, NextFunction } from "express"

export default function validate[Endpoint](
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const schema = Joi.object({
    fieldName: Joi.string().required(),
    fieldId: Joi.number().required()
  })

  const { error } = schema.validate(req.body)
  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  next()
}
```

### Step 2: Create Controller
```typescript
// src/controllers/[feature]/[endpoint].ts
import { Request, Response } from "express"

export default async function handleEndpoint(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Business logic here
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: "Internal server error" })
  }
}
```

### Step 3: Add Route Definition
```typescript
// src/routes/[feature]-routes.ts
import validate[Endpoint] from "../middleware/request-validation/[feature]/validate-[endpoint]"
import handleEndpoint from "../controllers/[feature]/[endpoint]"

featureRoutes.post("/endpoint", validate[Endpoint], jwtVerifyAttachUser, handleEndpoint)
```

### Step 4: Register Route in Main App
```typescript
// src/index.ts (where routes are mounted)
app.use("/api/[feature]", featureRoutes)
```

## Authentication Patterns

### Public Routes (No Authentication)
```typescript
featureRoutes.post("/login", validateLogin, login)
```

### Protected Routes (Requires JWT)
```typescript
featureRoutes.post("/endpoint", validateEndpoint, jwtVerifyAttachUser, controller)
```

### Optional Authentication
```typescript
featureRoutes.get("/endpoint", jwtOptional, controller)
```

## Error Handling

Routes propagate errors to Express error handler:

```typescript
featureRoutes.post("/endpoint", validateInput, jwtVerifyAttachUser, async (req, res) => {
  try {
    // If validation fails, middleware returns 400
    // If JWT invalid, middleware returns 401
    // If controller throws, error handler catches it
    const result = await controller(req, res)
    res.json(result)
  } catch (error) {
    // Caught by Express error middleware
    next(error)
  }
})
```

## Route Registration in Main App

All routes are imported and mounted in `src/index.ts`:

```typescript
import authRoutes from "./routes/auth-routes"
import sandboxRoutes from "./routes/sandbox-routes"
import careerQuestRoutes from "./routes/career-quest-routes"

// Mount routes with appropriate prefix
app.use("/api/auth", authRoutes)
app.use("/api/sandbox", sandboxRoutes)
app.use("/api/career-quest", careerQuestRoutes)
```

## Common Patterns

### Nested Route Organization
Logical grouping by feature:
- `/api/auth/*` - Authentication endpoints
- `/api/sandbox/*` - Sandbox project operations
- `/api/pip/*` - Device management
- `/api/chat/*` - Chat across features

### Middleware Reuse
Common middleware shared across routes:
- JWT verification for protected features
- User attachment middleware
- Device connection confirmation

### Endpoint Naming
RESTful conventions:
- GET `/resource` - List all
- GET `/resource/:id` - Get single
- POST `/resource` - Create
- PUT `/resource/:id` - Update
- DELETE `/resource/:id` - Delete

## Testing Routes

### Manual Testing
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}'
```

### With Authentication
```bash
curl -X POST http://localhost:3000/api/sandbox/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"My Project"}'
```

## Important Notes

- **Middleware order matters** - Validation before confirmation, confirmation before controller
- **Keep routes simple** - Move complex logic to controllers or services
- **Use consistent naming** - Route files end with `-routes.ts`, controllers match endpoint
- **Export default** - Route files export the router as default
- **Mount in index.ts** - Routes only take effect when mounted in main app
- **Group by feature** - Create new route file for new feature area, not isolated endpoints
- **Reuse validation** - Don't duplicate validation logic across routes
- **Error responses consistent** - Use same error format across all endpoints

## Troubleshooting

**Route not responding**
- Check route is registered in `src/index.ts`
- Verify prefix matches when mounting
- Ensure middleware is not rejecting early

**Validation not working**
- Check middleware is imported and used in route definition
- Verify Joi schema in validation file
- Ensure validation middleware calls `next()` on success

**Authentication failing**
- Verify JWT token is being sent in Authorization header
- Check `jwtVerifyAttachUser` is in middleware chain
- Ensure JWT secret matches in `.env`

**Controller not executing**
- Check all preceding middleware is calling `next()`
- Verify middleware order (validation before confirmation)
- Check for syntax errors in route definitions
