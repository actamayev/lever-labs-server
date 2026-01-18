# src/middleware/jwt Directory - Claude Instructions

## Overview
This directory contains JWT (JSON Web Token) authentication middleware for protecting routes and verifying user identity. JWT tokens are used for stateless authentication - each request includes a token that proves the user's identity without requiring server-side session storage.

## Core Concepts

### JWT Flow
1. **User logs in** → Server issues JWT token
2. **Token stored** → Client keeps token in secure HTTP-only cookie
3. **Request made** → Client includes token in request
4. **Token verified** → Middleware validates token signature and expiry
5. **User attached** → If valid, `req.user` set to user object
6. **Route executes** → Controller can access `req.user`

### Token Structure
JWT tokens contain three parts (separated by dots):
- **Header**: Algorithm and token type
- **Payload**: User data (user ID, email, etc.)
- **Signature**: Server's cryptographic signature for verification

## Middleware Files

### jwt-verify-attach-user.ts
**Purpose**: Verify JWT token and attach user to request object

**Usage**: Apply to protected routes
```typescript
router.post("/endpoint", jwtVerifyAttachUser, controller)
```

**Behavior**:
1. Extracts token from HTTP-only cookie
2. Validates cookie structure with Joi schema
3. Decodes and verifies token signature
4. Looks up user in database
5. Attaches user object to `req.user`
6. Calls `next()` on success, returns 401 on failure

**Response Codes**:
- `200` - Success, user attached
- `401` - Token missing, invalid, or user not found

**Example Request**:
```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Cookie: auth_token=eyJhbGc..." \
  -H "Content-Type: application/json"
```

**Result on Request**:
```typescript
req.user = {
  id: "user-123",
  email: "user@example.com",
  // ... other user fields
}
```

### jwt-verify-attach-user-id.ts
**Purpose**: Verify JWT token and attach only the user ID

**Usage**: When you only need the ID, not full user object
```typescript
router.post("/endpoint", jwtVerifyAttachUserId, controller)
```

**Behavior**:
- Similar to `jwt-verify-attach-user` but lighter weight
- Extracts token and decodes to get user ID only
- Attaches to `req.userId` (not full user object)
- Useful when database lookup not needed

**Response**:
```typescript
req.userId = "user-123"
```

### jwt-verify-socket.ts
**Purpose**: Verify JWT tokens for WebSocket connections

**Usage**: Socket.IO authentication middleware
```typescript
io.use(jwtVerifySocket)
io.on("connection", (socket) => {
  // socket.user is now attached
  const userId = socket.user.id
})
```

**Behavior**:
- Extracts token from query params or headers
- Verifies token validity
- Attaches decoded user to socket object
- Disconnects socket if token invalid

**Socket Attachment**:
```typescript
socket.user = {
  id: "user-123",
  email: "user@example.com"
}
```

## Helper Functions

### getAuthTokenFromCookies()
Extracts JWT token from HTTP-only cookie

```typescript
import { getAuthTokenFromCookies } from "../cookie-helpers"

const token = getAuthTokenFromCookies(req)
// Returns token string or undefined
```

### getDecodedId()
Decodes JWT token and extracts user ID

```typescript
import getDecodedId from "../../utils/auth-helpers/get-decoded-id"

const userId = await getDecodedId(accessToken)
// Returns user ID from token payload
```

## Token Management

### Cookie Configuration
Tokens stored in secure HTTP-only cookies:
- **HttpOnly** - Not accessible via JavaScript (prevents XSS)
- **Secure** - Only sent over HTTPS
- **SameSite** - Prevents CSRF attacks
- **MaxAge** - Expiration time

### Token Validation
Validates:
- Token signature (cryptographic verification)
- Token expiration time
- Token format correctness
- Token issued by correct server

### Token Refresh
When token approaches expiration:
1. Backend issues new token
2. Client receives new token
3. Old token still valid (grace period)
4. Eventually old token expires

## Integration Patterns

### Protected Routes
```typescript
// Require valid JWT
router.post("/api/profile", jwtVerifyAttachUser, controller)

// Also checks user owns resource
router.get("/api/projects/:projectId",
  jwtVerifyAttachUser,
  confirmProjectOwnership,
  controller
)
```

### Optional Authentication
```typescript
// Allow both authenticated and public
router.get("/api/public-content", jwtOptional, controller)

// In controller:
if (req.user) {
  // Authenticated - show personalized
} else {
  // Public - show default
}
```

### Socket.IO Authentication
```typescript
// Verify socket connection
io.use(jwtVerifySocket)

io.on("connection", (socket) => {
  console.log(`User ${socket.user.id} connected`)

  socket.on("message", (data) => {
    // socket.user already verified
    handleMessage(socket.user.id, data)
  })
})
```

## Error Handling

### Common Errors

**"Unauthorized User"** (401)
- Token missing from cookie
- Token expired
- Token signature invalid
- User not found in database

**"Invalid token format"** (401)
- Token corrupted
- Token missing parts
- Not a valid JWT

**"User not found"** (401)
- Token valid but user deleted
- User ID invalid
- Database error

### Error Recovery
```typescript
try {
  const userId = await getDecodedId(accessToken)
} catch (error) {
  // Token invalid - return 401
  res.status(401).json({ error: "Unauthorized User" })
}
```

## Security Best Practices

### Token Handling
- **Never expose in logs** - Tokens are secrets
- **Store securely** - HTTP-only cookies
- **Validate on every request** - Don't trust cached tokens
- **Use HTTPS only** - Prevent token interception
- **Set short expiry** - Limit damage of compromised token

### Middleware Usage
- **Always validate** - Use JWT middleware on protected routes
- **Check token early** - Fail fast before processing
- **Attach user data** - Make it available to controllers
- **Verify ownership** - Don't just verify token exists
- **Log authentication events** - Track login/logout

### Cookie Security
- **HttpOnly flag** - Prevents JavaScript access
- **Secure flag** - HTTPS only
- **SameSite** - Prevent CSRF
- **Clear on logout** - Remove cookie when user logs out

## Testing JWT Middleware

### Local Testing
```typescript
// Generate test token
const testToken = jwt.sign(
  { userId: "test-user-123" },
  process.env.JWT_SECRET
)

// Test with cookie
const res = await request(app)
  .get("/api/protected")
  .set("Cookie", `auth_token=${testToken}`)
  .expect(200)
```

### Mock Testing
```typescript
jest.mock("../cookie-helpers", () => ({
  getAuthTokenFromCookies: jest.fn(() => "valid-token")
}))

jest.mock("../../utils/auth-helpers/get-decoded-id", () =>
  jest.fn(async () => "user-123")
)
```

## Important Notes

- **Tokens are stateless** - Server doesn't store token state
- **Verification is server-side** - Always validate, never trust client
- **Cookies are preferred** - More secure than Authorization header
- **User must be in database** - Token alone isn't enough
- **Token expiry is enforced** - Old tokens automatically rejected
- **Logout clears cookie** - But token still technically valid
- **JWT secret is critical** - If compromised, all tokens invalid
- **Multiple middleware available** - Choose based on your needs

## Troubleshooting

**"Unauthorized User" on every request**
- Check cookie is being set on login
- Verify JWT secret matches
- Ensure token hasn't expired
- Check user exists in database

**JWT verification fails locally but works in staging**
- JWT secret may differ between environments
- Check `.env` file has correct secret
- Verify token issued with same secret

**Cookie not being sent with request**
- Check HttpOnly flag is set
- Verify HTTPS in production
- Check CORS settings allow cookies

**User null after middleware**
- Verify user exists in database
- Check user ID in token matches database
- Ensure JWT token valid
