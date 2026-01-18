# src/controllers/auth Directory - Claude Instructions

## Overview
This directory contains authentication route handlers: login, logout, and Google OAuth integration. These controllers manage user session creation, token generation, and authentication state.

## Key Files

### login.ts
**Purpose:** Authenticate user with email/username and password

**Function:**
```typescript
async function login(req: Request, res: Response): Promise<void>
```

**Authentication Workflow:**
1. Extract contact (email/username) and password from request body
2. Determine if contact is email or username
3. Retrieve user record from database
4. Validate password using Hash.checkPassword
5. Generate JWT token
6. Decrypt user email (stored encrypted)
7. Fetch student classes if applicable
8. Set secure HTTP-only cookie
9. Auto-connect to last used device
10. Return user data and classes

**Request:**
```typescript
{
  loginInformation: {
    contact: string,        // email or username
    password: string
  }
}
```

**Response:**
```typescript
{
  personalInfo: {
    username: string,
    email: string,
    defaultSiteTheme: string,
    profilePictureUrl: string | null,
    sandboxNotesOpen: boolean,
    name: string
  },
  teacherData: {
    isTeacher: boolean,
    classrooms?: Classroom[]
  },
  studentClasses: Class[],
  autoConnectedPipUUID: string | null
}
```

**Error Cases:**
- Account doesn't exist: 400 "There is no Lever Labs account associated with {contact}"
- Google-only account: 400 "Please log in with Google"
- Wrong password: 400 "Wrong password. Please try again."
- Server error: 500

### logout.ts
**Purpose:** Terminate user session and clear authentication

**Function:**
```typescript
async function logout(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Clear authentication cookie
2. Clear any browser-side session data
3. Return success response

**Response:**
```typescript
{
  success: ""
}
```

### google-login-auth-callback.ts
**Purpose:** Handle Google OAuth callback after user authorization

**Function:**
```typescript
async function googleLoginAuthCallback(req: Request, res: Response): Promise<void>
```

**OAuth Flow:**
1. Receive authorization code from Google
2. Exchange code for ID token via OAuth2Client
3. Verify ID token with Google
4. Extract user profile (email, name, picture)
5. Find existing user by email or create new
6. Generate JWT token
7. Set secure cookie
8. Return user data

**Request:**
```typescript
{
  code: string  // Authorization code from Google
}
```

**Response:**
```typescript
{
  personalInfo: { /* user data */ },
  teacherData: { /* teacher info if applicable */ },
  studentClasses: Class[],
  autoConnectedPipUUID: string | null
}
```

## Authentication Architecture

### JWT Token Structure
```typescript
{
  userId: string,
  username: string,
  isActive: boolean
}
```

Generated via `signJWT()` utility in `src/utils/auth-helpers/jwt/`

### Cookie Setup
- **Name:** auth_token
- **HttpOnly:** true (prevents JS access)
- **Secure:** true (HTTPS only)
- **SameSite:** strict (CSRF protection)
- **Path:** /
- **Expiry:** Set to JWT expiry (typically 7 days)

### Password Security
- Passwords hashed with bcrypt via Hash class
- Uses cryptographically secure comparison
- Never stored or transmitted in plain text

### Email Encryption
- User emails stored encrypted in database
- Decrypted in login controller using Encryptor class
- KEY_NAME: `EMAIL_ENCRYPTION_KEY` from environment

## Authorization Context

### User Attachment
After successful login, user context available in middleware chain:
```typescript
req.user     // Full user object from database
req.userId   // User ID string
```

### Role Detection
- `extractTeacherDataFromUserData()` extracts teacher info
- Determines if user has classroom privileges
- Returns teacher-specific data if applicable

### Class Information
- Student classes fetched and returned in response
- Used by frontend for dashboard display
- Includes classroom codes and enrollments

## Integration Patterns

### Authentication Middleware Chain
```typescript
// Route setup
POST /api/auth/login
  → validateLoginRequest (Joi schema)
  → login controller (in this file)
  → Cookie set on response

POST /api/auth/google/callback
  → validateGoogleCallback (code validation)
  → googleLoginAuthCallback (in this file)
  → Cookie set on response

GET /api/auth/logout
  → jwtVerifyAttachUser (optional)
  → logout controller (in this file)
```

### Google OAuth Setup
- OAuth2Client initialized in `src/utils/google/create-google-auth-client.ts`
- Client ID and Secret from environment variables
- Redirect URI registered with Google Console

### Related Utilities
- `determineLoginContactType()` - Email vs username detection
- `retrieveUserFromContact()` - Database lookup
- `signJWT()` - Token generation
- `Hash.checkPassword()` - Password verification
- `Encryptor` - Email decryption
- `extractTeacherDataFromUserData()` - Teacher info extraction
- `autoConnectToPip()` - Device reconnection

## Database Operations

### Read
- User lookup by email: `findUserByEmail()`
- User lookup by username: `findUserByUsername()`
- Student classes: `retrieveStudentClasses(userId)`
- Login history: Added via `addLoginHistoryRecord()`

### Write
- Login history record: `addLoginHistoryRecord(userId)` - Async, fire-and-forget
- User creation: `createUserFromGoogle()` for new Google accounts

## Security Considerations

### HTTPS Requirement
- Cookies marked as `secure: true` - requires HTTPS
- OAuth redirects must use HTTPS in production
- In development, HTTP allowed locally

### Token Validation
- JWT verified on each protected request
- Token expiry enforced by middleware
- Secure comparison prevents timing attacks

### Credential Handling
- Passwords never logged or exposed
- Email decryption only in controller (sensitive)
- Password hash comparison timing-safe

### OAuth Security
- ID token verified with Google servers
- Audience check prevents token misuse
- One-time use of authorization code
- PKCE available for enhanced security

## Error Handling

### Authentication Failures
```typescript
// Wrong credentials
400: { message: "Wrong password. Please try again." }

// Account not found
400: { message: "There is no Lever Labs account associated with {contact}" }

// OAuth issues
400: { error: "OAuth failed" }

// Server errors
500: { error: "Internal Server Error: Unable to Login" }
```

### Validation Errors
- Handled by validation middleware before reaching controller
- Returns 400 with schema violation details

## Best Practices

- **Always set secure cookies** - HttpOnly, Secure, SameSite flags required
- **Validate inputs** - Contact and password validated by middleware
- **Log login attempts** - Track for security audit
- **Handle edge cases** - Google-only accounts, missing data
- **Fetch related data** - Classes, teacher info in single request
- **Async operations** - Non-blocking file operations (login history)

## Common Workflows

### Traditional Login Flow
```typescript
1. User enters email/username and password in UI
2. POST /api/auth/login with credentials
3. Controller validates in database
4. Token generated and cookie set
5. User data and classes returned
6. Frontend stores session and navigates to dashboard
```

### Google OAuth Flow
```typescript
1. User clicks "Sign in with Google"
2. Browser redirected to Google consent screen
3. User authorizes app
4. Google redirects with authorization code
5. Frontend sends code to POST /api/auth/google/callback
6. Controller exchanges code for ID token
7. User found or created in database
8. Token generated and cookie set
9. Frontend navigates to dashboard
```

### Logout Flow
```typescript
1. User clicks logout button
2. GET /api/auth/logout (or POST)
3. Controller clears auth cookie
4. Frontend clears local session state
5. User redirected to login page
```

## Performance Considerations

- **Query optimization** - User lookups indexed on email/username
- **Async history** - Login history recorded without blocking response
- **Token caching** - Consider caching JWT decode results
- **Database pooling** - Connection management in Prisma

## Troubleshooting

**"Wrong password" on correct credentials**
- Check password hashing matches
- Verify Hash.checkPassword implementation
- Ensure account not locked or deactivated

**Google login fails with "OAuth failed"**
- Verify GOOGLE_CLIENT_ID and SECRET in environment
- Check redirect URI matches Google Console settings
- Ensure HTTPS in production
- Verify authorization code not expired

**Cookie not being set**
- Check response headers for Set-Cookie
- Verify HTTPS in production
- Check browser cookie settings
- Verify SameSite compatibility

**Missing user data in response**
- Verify email decryption success
- Check student classes query
- Ensure teacher data extraction handles missing fields

## Important Notes

- **Session state** - Stored in JWT token, validated on each request
- **Stateless authentication** - No server-side session storage (except login history)
- **Token expiry** - Clients must handle token refresh or re-login
- **Multi-device support** - Each device gets independent token via cookie
- **Security headers** - Ensure additional headers (X-Frame-Options, etc.) configured
- **Email encryption** - Required for privacy, decryption happens here
- **Teacher auto-detection** - Based on `extractTeacherDataFromUserData()` logic

## Integration with Other Systems

### Database Layer
- User lookups in credentials table
- Email decryption requires encryption keys
- Login history records for audit trail

### Security Layer
- Hash class for password verification
- Encryptor for email decryption
- JWT for stateless token management

### OAuth Layer
- Google OAuth2Client for token exchange
- ID token verification via Google servers

### Real-time Layer
- BrowserSocketManager may be initialized with user session
- Auto-connect to last device on login

### Classroom Layer
- Student classes fetched and returned
- Teacher information extracted and included
