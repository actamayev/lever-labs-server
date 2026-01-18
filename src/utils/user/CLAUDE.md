# src/utils/user Directory - Claude Instructions

## Overview
This directory contains utility functions for user data management and transformation. These functions handle converting user data between database and API formats.

## Key Files

### camel-case-user-search-result.ts
**Purpose:** Convert user search results from database format to API format

**Function:**
```typescript
function camelCaseUserSearchResult(dbUser: UserSearchResultDB): UserSearchResultAPI
```

**Transformation:**
```typescript
// Database format (snake_case)
{
  user_id: "123",
  user_email: "john@example.com",
  user_name: "John Doe",
  user_picture: "https://...",
  is_teacher: true,
  created_at: "2023-01-01T00:00:00Z"
}

// API format (camelCase)
{
  userId: "123",
  userEmail: "john@example.com",
  userName: "John Doe",
  userPicture: "https://...",
  isTeacher: true,
  createdAt: "2023-01-01T00:00:00Z"
}
```

**Usage:**
```typescript
import camelCaseUserSearchResult from "../../utils/user/camel-case-user-search-result"

// Search for users
const dbResults = await searchUsers(query)

// Convert to API format
const apiResults = dbResults.map(camelCaseUserSearchResult)

res.json(apiResults)
```

## User Data Transformations

### Purpose of Conversion
- **Database**: Uses snake_case following PostgreSQL conventions
- **API**: Uses camelCase following JavaScript/REST conventions
- **Middleware**: Converts at boundaries

### Full User Object
```typescript
// Database format
{
  user_id: "123",
  user_email: "john@example.com",
  user_name: "John Doe",
  user_picture: "url",
  email_verified: true,
  phone_number: "555-1234",
  date_of_birth: "1990-01-01",
  created_at: "2023-01-01",
  updated_at: "2024-01-01",
  is_active: true,
  is_teacher: false,
  is_admin: false
}

// API format
{
  userId: "123",
  userEmail: "john@example.com",
  userName: "John Doe",
  userPicture: "url",
  emailVerified: true,
  phoneNumber: "555-1234",
  dateOfBirth: "1990-01-01",
  createdAt: "2023-01-01",
  updatedAt: "2024-01-01",
  isActive: true,
  isTeacher: false,
  isAdmin: false
}
```

## Common User Operations

### User Search
```typescript
async function searchUsers(query: string, limit: number = 10) {
  const dbResults = await db.users.search(query, limit)

  return dbResults.map(user => ({
    id: user.user_id,
    name: user.user_name,
    email: user.user_email,
    picture: user.user_picture,
    role: user.is_teacher ? "teacher" : "student"
  }))
}
```

### User Profile
```typescript
async function getUserProfile(userId: string) {
  const dbUser = await db.users.findById(userId)

  return {
    id: dbUser.user_id,
    name: dbUser.user_name,
    email: dbUser.user_email,
    picture: dbUser.user_picture,
    role: dbUser.is_teacher ? "teacher" : "student",
    joinDate: dbUser.created_at,
    isVerified: dbUser.email_verified
  }
}
```

### User Update
```typescript
async function updateUserProfile(userId: string, updates: UserUpdateData) {
  // Convert from camelCase to snake_case
  const dbUpdates = {
    user_name: updates.userName,
    user_picture: updates.userPicture,
    phone_number: updates.phoneNumber
  }

  const updated = await db.users.update(userId, dbUpdates)

  // Convert back to camelCase
  return camelCaseUserSearchResult(updated)
}
```

## Filtering Sensitive Data

### Public Profile
```typescript
function getPublicProfile(user: FullUser) {
  return {
    id: user.userId,
    name: user.userName,
    picture: user.userPicture,
    // No email, phone, personal data
  }
}
```

### Private Profile
```typescript
function getPrivateProfile(user: FullUser, userId: string) {
  // Only return full info if it's the user's own profile
  if (user.userId === userId) {
    return {
      id: user.userId,
      name: user.userName,
      email: user.userEmail,
      picture: user.userPicture,
      phone: user.phoneNumber,
      createdAt: user.createdAt
    }
  }

  return getPublicProfile(user)
}
```

## Integration Patterns

### In Controllers
```typescript
export default async function getUserController(req, res) {
  try {
    const userId = req.params.id
    const dbUser = await findUserById(userId)
    const apiUser = camelCaseUserSearchResult(dbUser)
    res.json(apiUser)
  } catch (error) {
    res.status(500).json({ error: "Server error" })
  }
}
```

### In Routes
```typescript
router.get("/users/search", validateSearchQuery, async (req, res) => {
  const results = await db.users.search(req.query.q)
  const apiResults = results.map(camelCaseUserSearchResult)
  res.json(apiResults)
})
```

### In Socket Events
```typescript
socket.on("userSearch", async (query) => {
  const results = await db.users.search(query)
  const apiResults = results.map(camelCaseUserSearchResult)
  socket.emit("searchResults", apiResults)
})
```

## Search Functionality

### Full Text Search
```typescript
async function searchUsersByName(query: string) {
  const dbResults = await db.users.findMany({
    where: {
      user_name: { contains: query, mode: "insensitive" }
    },
    take: 10
  })

  return dbResults.map(camelCaseUserSearchResult)
}
```

### Email Search
```typescript
async function findUserByEmail(email: string) {
  const dbUser = await db.users.findUnique({
    where: { user_email: email }
  })

  return dbUser ? camelCaseUserSearchResult(dbUser) : null
}
```

### Pagination
```typescript
async function searchUsersWithPagination(
  query: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit

  const [total, dbResults] = await Promise.all([
    db.users.count({ where: { user_name: { contains: query } } }),
    db.users.findMany({
      where: { user_name: { contains: query } },
      skip,
      take: limit
    })
  ])

  return {
    results: dbResults.map(camelCaseUserSearchResult),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}
```

## Best Practices

### Consistency
- **Always convert at boundaries** - API always uses camelCase
- **Database always snake_case** - PostgreSQL convention
- **Map fields consistently** - Same field name mapping everywhere

### Performance
```typescript
// ✅ Good: Single pass conversion
const converted = dbUsers.map(camelCaseUserSearchResult)

// ❌ Inefficient: Multiple conversions
const converted1 = dbUsers.map(camelCaseUserSearchResult)
const converted2 = dbUsers.map(camelCaseUserSearchResult)
```

### Data Filtering
```typescript
// ✅ Good: Filter sensitive before sending
const publicData = {
  name: user.userName,
  picture: user.userPicture
  // Email not included
}

// ❌ Bad: Send all data, filter on client
const allData = camelCaseUserSearchResult(user)
// Client filters email... but it was sent!
```

## Troubleshooting

**Field names mismatched**
- Check conversion function matches schema
- Verify database column names
- Review API contract
- Test with sample data

**Sensitive data exposed**
- Audit conversion functions
- Review what fields included
- Check search results
- Add data filtering

**Performance issues**
- Profile database queries
- Check for N+1 problems
- Consider caching results
- Batch operations

## Important Notes

- **Naming convention boundary** - Convert at API/DB edge
- **Consistency critical** - Use same conversion everywhere
- **Performance matters** - Profile bulk conversions
- **Security sensitive** - Filter before exposing
- **Type safety** - Use TypeScript for conversions
