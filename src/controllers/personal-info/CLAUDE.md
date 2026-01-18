# src/controllers/personal-info Directory - Claude Instructions

## Overview
This directory contains route handlers for user profile management. These controllers handle user data updates, profile picture management, and theme preferences.

## Key Files

### get-personal-info.ts
**Purpose:** Retrieve authenticated user's profile information

**Function:**
```typescript
async function getPersonalInfo(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract userId from request
2. Query user profile from database
3. Decrypt sensitive fields (email)
4. Return user data

**Response:**
```typescript
{
  userId: string,
  username: string,
  email: string,
  name: string,
  profilePictureUrl: string | null,
  defaultSiteTheme: "light" | "dark" | "auto",
  sandboxNotesOpen: boolean,
  emailVerified: boolean,
  createdAt: Date
}
```

### set-default-site-theme.ts
**Purpose:** Update user's preferred theme

**Function:**
```typescript
async function setDefaultSiteTheme(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract userId and theme preference
2. Validate theme value
3. Update database
4. Return success

**Request:**
```typescript
{
  theme: "light" | "dark" | "auto"
}
```

**Response:**
```typescript
{
  success: ""
}
```

### set-sandbox-notes-open.ts
**Purpose:** Toggle sandbox notes panel visibility preference

**Function:**
```typescript
async function setSandboxNotesOpen(req: Request, res: Response): Promise<void>
```

**Request:**
```typescript
{
  sandboxNotesOpen: boolean
}
```

### remove-current-profile-picture.ts
**Purpose:** Delete user's profile picture

**Function:**
```typescript
async function removeCurrentProfilePicture(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract userId from request
2. Get current profile picture ID
3. Delete from S3 (if stored there)
4. Clear picture reference in database
5. Return success

**Response:**
```typescript
{
  success: ""
}
```

### upload-profile-picture.ts
**Purpose:** Upload new profile picture

**Function:**
```typescript
async function uploadProfilePicture(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract userId and file from request
2. Validate file (size, type)
3. Upload to S3 via S3Manager
4. Get S3 URL
5. Delete old picture if exists
6. Update user record with new URL
7. Return picture URL

**Request:**
```
FormData:
  file: File (image)
```

**Response:**
```typescript
{
  profilePictureUrl: string
}
```

**Validation:**
- Max size: 5MB
- Allowed types: jpg, png, gif
- Resize for optimization

### update-profile.ts
**Purpose:** Update multiple profile fields

**Function:**
```typescript
async function updateProfile(req: Request, res: Response): Promise<void>
```

**Request:**
```typescript
{
  name?: string,
  username?: string,
  theme?: "light" | "dark" | "auto"
}
```

**Response:**
```typescript
{
  success: "",
  updatedProfile: {
    userId: string,
    name: string,
    username: string,
    theme: string
  }
}
```

## Database Operations

### Read
- `getUserProfile(userId)` - Full user data
- `getUserPreferences(userId)` - Theme, UI state

### Write
- `updateUserPreference(userId, key, value)` - Single pref
- `updateUserProfile(userId, updates)` - Multiple fields
- `updateProfilePictureUrl(userId, url)` - Picture URL

## File Storage

### S3 Integration
- Uses S3Manager singleton
- Stores profile pictures in S3
- Generates presigned URLs
- Deletes old pictures on replacement

**S3 Bucket Path:**
```
profile-pictures/{userId}/{timestamp}-{filename}
```

## Error Handling

```typescript
// User not found
404: { error: "User not found" }

// Invalid file
400: { error: "Invalid file format or size" }

// S3 upload failed
500: { error: "Failed to upload picture" }

// Invalid theme
400: { error: "Invalid theme value" }

// Server error
500: { error: "Internal Server Error: ..." }
```

## Validation

### Profile Picture
- Max size: 5MB
- Types: jpg, png, gif, webp
- Min dimensions: 100x100
- Aspect ratio: flexible

### Username
- 3-30 characters
- Alphanumeric + underscore
- Lowercase only
- Unique check

### Name
- Max 100 characters
- Allows spaces
- No special characters

## Best Practices

- **Validate all inputs** - Before database write
- **Atomic operations** - Update related fields together
- **File cleanup** - Delete old pictures
- **URL generation** - Use presigned URLs for S3
- **Cache preferences** - Client-side caching of theme
- **Error recovery** - Clear error messages

## Common Workflows

### Updating Profile
```typescript
1. User opens profile settings
2. Modifies name/username/theme
3. Clicks save
4. PUT /api/personal-info with updates
5. Server validates and updates
6. Returns success
7. UI confirms changes
```

### Changing Theme
```typescript
1. User clicks theme selector
2. Selects light/dark/auto
3. PUT /api/personal-info/theme
4. Server updates preference
5. Browser applies theme
6. Preference persists
```

### Upload Profile Picture
```typescript
1. User clicks "Change Picture"
2. Selects image file
3. File uploaded via FormData
4. POST /api/personal-info/picture
5. Server validates file
6. Uploads to S3
7. Updates user record
8. Returns new URL
9. UI displays new picture
```

## Real-time Features

### Preference Sync
- Theme changes apply immediately
- UI state persists across sessions
- No page reload needed

## Performance Considerations

- **Image optimization** - Resize/compress on upload
- **Lazy loading** - Pictures load on demand
- **CDN cache** - S3 URLs cacheable
- **Database indexing** - UserId lookups

## Important Notes

- **Email encrypted** - Decrypted only when needed
- **Theme preference** - Stored per user, applies globally
- **Pictures in S3** - Not in database
- **Username immutable** - May be permanent
- **Preferences persistent** - Survive logout
- **Profile public** - Name/picture may be visible

## Integration with Other Systems

### Database Layer
- User profile storage
- Preference persistence
- Profile picture URL storage

### S3 Integration
- File upload/download
- URL generation
- File deletion

### Authentication Layer
- User context required
- Profile ownership verification

### Type System
- Strong typing of profile objects
- Validation type guards
- Response type checking

### Middleware Layer
- Authentication required
- Input validation
- File size limits
