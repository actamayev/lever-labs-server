# src/middleware/attach Directory - Claude Instructions

## Overview
This directory contains middleware that retrieves data and attaches it to requests for controller use. "Attach" middleware is convenience-focused: it extracts identifiers, fetches related resources, and makes them available downstream without blocking the request.

## Pattern
```typescript
export default async function attachSomething(req, res, next) {
  const id = req.params.id
  const data = await database.find(id)
  req.something = data
  next()
}
```

**vs Confirm Middleware:**
- **Confirm**: Validates authorization (rejects if failed)
- **Attach**: Fetches data (assumes controller will use it)

## Key Files

### attach-career-id-from-uuid.ts
Converts career UUID parameter to numeric ID for database queries.
```typescript
// Input: GET /careers/:careerUUID
// Attaches: req.careerID (numeric ID)
```

### attach-career-chat-id.ts
Retrieves or creates career chat conversation.
```typescript
// Looks up existing chat by careerID + userID
// Creates if doesn't exist
// Attaches: req.careerId, req.careerChatId
```

### attach-career-conversation-history.ts
Loads full message history for career chat.
```typescript
// Fetches recent messages (last 30)
// Attaches: req.conversationHistory (Message[])
// Used by LLM context builder
```

### attach-challenge-id-from-uuid.ts
Converts challenge UUID to numeric ID.

### attach-challenge-chat.ts
Retrieves or creates challenge-specific chat.

### attach-sandbox-project-data.ts
Fetches sandbox project details by projectID.
```typescript
// Loads code, metadata
// Attaches: req.sandboxProject
```

### attach-classroom-data.ts
Fetches classroom by classroomID.
```typescript
// Loads name, teacher, students
// Attaches: req.classroomData
```

## Workflow

### Typical Route Setup
```typescript
router.get(
  "/career/:careerUUID",
  jwtVerifyAttachUser,           // Extract user
  attachCareerIdFromUuid,         // UUID → ID
  attachCareerConversationHistory, // Load history
  careerController               // Use attached data
)
```

### Data Flow
Request (params) → Middleware chain → Attached data → Controller receives enriched req

## Patterns

### Database Lookups
- Simple `findById()` queries
- Aggregate related data
- Handle not-found gracefully (pass null or empty)

### Data Attachment
```typescript
req.careerID = numericId
req.conversationHistory = messages
req.classroomData = classroom
```

### Error Handling
- Non-blocking: Don't reject request
- Log errors for debugging
- Continue with null/empty if lookup fails

## Best Practices

- **Keep lookups fast** - Single queries, no N+1
- **Non-blocking** - Don't use for validation
- **Single responsibility** - One data type per middleware
- **Naming clear** - `attach-*` prefix indicates purpose
- **Placement** - After auth, before controller

## Common Usage

### Career Context
```typescript
Attach career UUID → ID
Attach chat history
→ Controller has all context
```

### Challenge Context
```typescript
Attach challenge UUID → ID
Attach sandbox project
→ Controller ready to process
```

### Classroom Context
```typescript
Attach classroom data
Attach student list
→ Controller displays class info
```

## Integration with Request Pipeline

```
Auth Middleware
    ↓
Attach Middleware (this directory)
    ↓
Confirm Middleware (validation)
    ↓
Controller (uses attached data)
```

## Error Handling Patterns

**Soft Failures** (preferred):
```typescript
const data = await find(id).catch(() => null)
req.attachedData = data  // May be null
next()
```

**Skip Attachment**:
```typescript
if (!id) {
  return next()  // Not attached, controller handles
}
```

## Performance Notes

- **Caching**: Data may be cached (career/challenge static)
- **Lazy loading**: Only fetch what controller needs
- **Query optimization**: Index on common lookup fields

## Important Notes

- **Non-blocking design** - Attach doesn't reject
- **Optional attachment** - Controller may not use attached data
- **Convenience layer** - Reduces controller boilerplate
- **Proper placement** - After auth, before validation
- **Clear naming** - `attach-*` indicates purpose

## Integration Points

**Database Layer**: Fetches from DB operations
**Request Pipeline**: Adds to req object
**Controllers**: Uses req.attachedData
**Route Handlers**: Chains middleware

## Related Patterns

- **Confirm Middleware**: Validates authorization
- **Validation Middleware**: Checks request format
- **JWT Middleware**: Extracts user context
