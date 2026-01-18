# src/utils/google Directory - Claude Instructions

## Overview
This directory contains Google OAuth integration utilities. These functions handle Google authentication client setup and OAuth flow coordination for user sign-in.

## Key Files

### create-google-auth-client.ts
**Purpose:** Initialize and configure Google OAuth client

**Function:**
```typescript
function createGoogleAuthClient(): OAuth2Client
```

**Usage:**
```typescript
import createGoogleAuthClient from "../../utils/google/create-google-auth-client"

const googleClient = createGoogleAuthClient()

// Get authorization URL
const authUrl = googleClient.generateAuthUrl({
  access_type: "offline",
  scope: ["profile", "email"]
})

// Exchange code for tokens
const tokens = await googleClient.getToken(code)
```

**Configuration:**
```typescript
const client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${process.env.APP_URL}/api/auth/google/callback`
})
```

## Google OAuth Flow

**Complete Flow:**
```
1. User clicks "Sign in with Google"
2. Browser redirected to Google login
3. User grants permission
4. Google redirects with authorization code
5. Server exchanges code for ID token
6. Server verifies token with Google
7. Extract user info (email, name, profile pic)
8. Find/create user in database
9. Issue session token
10. Redirect to app
```

**Code Implementation:**
```typescript
// 1. Generate auth URL
const authUrl = googleClient.generateAuthUrl({
  access_type: "offline",
  scope: ["profile", "email"]
})

// Redirect user to authUrl

// 2. Handle callback
async function handleGoogleCallback(code: string) {
  // Get tokens
  const { tokens } = await googleClient.getToken(code)

  // Verify ID token
  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID
  })

  // Extract user info
  const payload = ticket.getPayload()
  const email = payload.email
  const name = payload.name
  const picture = payload.picture

  // Find or create user
  let user = await findUserByEmail(email)
  if (!user) {
    user = await createUser({ email, name, picture })
  }

  // Issue session
  const sessionToken = createToken(user.id)
  return { user, sessionToken }
}
```

## OAuth Configuration

### Environment Variables Required
```bash
GOOGLE_CLIENT_ID=1234567890-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-1234567890abcdefghijk
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Scopes
```typescript
// Minimal scopes needed
const scopes = ["profile", "email"]

// What they provide:
// - profile: name, profile picture, gender, locale
// - email: email address and verification status
```

## Common Patterns

### User Creation from Google
```typescript
async function createUserFromGoogle(googleProfile: GoogleProfile) {
  return await createUser({
    email: googleProfile.email,
    emailVerified: googleProfile.email_verified,
    name: googleProfile.name,
    picture: googleProfile.picture,
    googleId: googleProfile.sub,  // Google user ID
    authProvider: "google"
  })
}
```

### Token Verification
```typescript
async function verifyGoogleToken(idToken: string) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    return {
      valid: true,
      payload: ticket.getPayload()
    }
  } catch (error) {
    return {
      valid: false,
      error: error.message
    }
  }
}
```

### Linking Google Account
```typescript
async function linkGoogleAccount(userId: string, googleProfile: GoogleProfile) {
  return await updateUser(userId, {
    googleId: googleProfile.sub,
    picture: googleProfile.picture
  })
}
```

## Security Considerations

### ID Token Verification
```typescript
// ✅ Always verify tokens
const ticket = await googleClient.verifyIdToken({
  idToken: token,
  audience: GOOGLE_CLIENT_ID
})

// ❌ Never trust unverified tokens
const payload = jwt.decode(token)  // No verification!
```

### HTTPS Required
```typescript
// Production must use HTTPS
const redirectUri = process.env.APP_URL + "/callback"
// HTTPS in production, HTTP only for development
```

### Secret Security
```bash
# ✅ Environment variable
GOOGLE_CLIENT_SECRET=abc123...

# ❌ Never commit to code
const secret = "abc123..."  // Wrong!
```

## Error Handling

### Common Errors
```typescript
try {
  const { tokens } = await googleClient.getToken(code)
} catch (error) {
  if (error.message.includes("invalid_grant")) {
    // Code expired or already used
    return res.status(400).json({ error: "Authorization code invalid" })
  }
  // Other errors
  throw error
}
```

### Token Expiration
```typescript
if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
  // Token expired, need fresh login
  return startNewOAuthFlow()
}
```

## Integration with App

### Login Controller
```typescript
export default async function googleLoginCallback(req, res) {
  try {
    const { code } = req.body

    // Exchange code for token
    const { tokens } = await googleClient.getToken(code)

    // Verify token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token
    })

    const profile = ticket.getPayload()

    // Find or create user
    let user = await findUserByEmail(profile.email)
    if (!user) {
      user = await createUserFromGoogle(profile)
    }

    // Create session
    const sessionToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    // Set cookie
    res.cookie("auth_token", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict"
    })

    res.json({ success: true, user })
  } catch (error) {
    res.status(400).json({ error: "OAuth failed" })
  }
}
```

## Best Practices

- **Always verify tokens** - Never trust client-side verification
- **Use HTTPS** - Required for OAuth
- **Secure redirect URIs** - Whitelist in Google Console
- **Handle token refresh** - If using offline access
- **Log auth events** - Track successful/failed logins
- **Test in staging** - Before deploying to production
- **Monitor errors** - Track OAuth failures

## Troubleshooting

**"Invalid redirect URI"**
- Check redirect URI in code matches Google Console
- Verify HTTPS in production
- Check for trailing slashes

**"Invalid client" error**
- Verify CLIENT_ID and SECRET are correct
- Check credentials not swapped
- Ensure not in dev/test mode

**Token verification fails**
- Check audience parameter matches CLIENT_ID
- Verify token not expired
- Ensure token from correct provider

**User creation fails**
- Check email format from Google
- Verify user not already exists
- Check database connection

## Important Notes

- **Google credentials are secrets** - Never expose in code
- **OAuth URL must HTTPS** - In production only
- **Tokens expire** - Handle expiration gracefully
- **User privacy** - Only request needed scopes
- **Documentation link**: [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
