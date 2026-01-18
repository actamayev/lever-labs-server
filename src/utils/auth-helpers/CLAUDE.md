# src/utils/auth-helpers Directory - Claude Instructions

## Overview
This directory contains utility functions for authentication operations including JWT handling, user identification, login/registration logic, and Google OAuth integration. These helpers support the authentication middleware and controllers.

## Directory Structure

```
auth-helpers/
├── determine-contact-type.ts      # Email vs username detection
├── get-decoded-id.ts              # Extract user ID from JWT token
├── jwt/                           # JWT token operations
├── login/                         # Login logic utilities
├── register/                      # Registration utilities
└── google/                        # Google OAuth helpers
```

## Core Files

### determine-contact-type.ts
**Purpose:** Determine if input is an email or username

**Function:**
```typescript
function determineContactType(input: string): "email" | "username"
```

**Usage:**
```typescript
const type = determineContactType("user@example.com")  // "email"
const type = determineContactType("john_doe")          // "username"
```

**Used by:** Login controller to know which field to query

### get-decoded-id.ts
**Purpose:** Extract user ID from JWT token

**Function:**
```typescript
async function getDecodedId(token: string): Promise<string>
```

**Usage:**
```typescript
import getDecodedId from "../../utils/auth-helpers/get-decoded-id"

const userId = await getDecodedId(accessToken)
```

**Token Verification:**
- Verifies JWT signature using server secret
- Decodes payload to extract user ID
- Throws error if token invalid or expired
- Used by JWT middleware to attach user

### jwt/ Subdirectory
**Purpose:** JWT token generation and validation

**Files:**
- Token creation on login/register
- Token refresh logic
- Token expiration handling

**Usage:**
```typescript
import { createToken, verifyToken } from "../../utils/auth-helpers/jwt"

const token = createToken(userId, expiresIn: "7d")
const decoded = verifyToken(token)
```

### login/ Subdirectory
**Purpose:** Login operation utilities

**Includes:**
- Credential validation
- User lookup
- Password verification
- Session creation
- Token generation

**Flow:**
```
1. Validate email/username format
2. Find user in database
3. Verify password hash
4. Generate JWT token
5. Set secure cookie
6. Return user data
```

### register/ Subdirectory
**Purpose:** User registration utilities

**Includes:**
- Input validation
- Duplicate checking
- Password hashing
- User creation
- Session initialization

**Flow:**
```
1. Validate email/username not taken
2. Validate password strength
3. Hash password with bcrypt
4. Create user record
5. Generate token
6. Create session
```

### google/ Subdirectory
**Purpose:** Google OAuth integration

**Includes:**
- Google client creation
- OAuth flow handling
- ID token verification
- User profile extraction
- Account linking

**OAuth Flow:**
```
1. Redirect to Google login
2. User grants permission
3. Receive authorization code
4. Exchange code for ID token
5. Verify token with Google
6. Extract user info
7. Find/create user
8. Issue session token
```

## Common Patterns

### User Identification
```typescript
// From email
const user = await findUserByEmail(email)

// From username
const user = await findUserByUsername(username)

// From ID (JWT payload)
const userId = await getDecodedId(token)
const user = await findUserById(userId)
```

### Password Handling
```typescript
import bcrypt from "bcrypt"

// Hash on registration
const hashedPassword = await bcrypt.hash(password, 10)
await createUser({ email, passwordHash: hashedPassword })

// Verify on login
const isValid = await bcrypt.compare(inputPassword, user.passwordHash)
if (!isValid) throw new Error("Invalid password")
```

### Token Management
```typescript
// Generate token
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
)

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET)
const userId = decoded.userId
```

## Integration Points

**With Controllers:**
- Login controller calls login utilities
- Register controller calls register utilities
- OAuth callback uses Google helpers

**With Middleware:**
- `jwtVerifyAttachUser` calls `getDecodedId`
- Validation middleware validates input format
- Confirmation middleware checks user ownership

**With Database:**
- Lookup operations via user repository
- Create operations for new users
- Update operations for user data

## Best Practices

- **Never expose passwords** - Use hashing and never log
- **Validate input** - Check email format, password strength
- **Verify tokens** - Always verify before trusting
- **Secure storage** - Keep JWT secret safe in environment
- **Hash consistently** - Use same algorithm/iterations
- **Handle errors gracefully** - Don't reveal user existence
- **Token expiry** - Implement refresh tokens for long sessions
- **Rate limiting** - Prevent brute force attacks
- **HTTPS required** - Always use HTTPS in production
- **Secure cookies** - HttpOnly, Secure, SameSite flags

## Troubleshooting

**"Invalid token" errors**
- Check JWT secret matches
- Verify token not expired
- Ensure token properly formatted

**"User not found" on valid token**
- Check user still exists in database
- Verify user ID in token is correct
- Check database connection

**Password verification fails**
- Ensure bcrypt used for both hash and compare
- Check password not modified after hashing
- Verify salt rounds match

**Google OAuth fails**
- Check OAuth credentials are valid
- Verify redirect URI whitelisted in Google Console
- Ensure client secret not committed
