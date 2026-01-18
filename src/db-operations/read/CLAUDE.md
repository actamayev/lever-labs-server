# src/db-operations/read Directory - Claude Instructions

## Overview
Organized read-only database queries using Prisma. Subdirectories by resource type (credentials, sandbox_project, classroom, etc.), returning typed data for controllers and services.

## Directory Structure

```
read/
├── action-to-code/              # Multiple choice validation
├── arcade-score/                # Game scores & leaderboards
├── block-to-function/           # Blockly assessment checks
├── career-message/              # Career chat history
├── challenge-message/           # Challenge guidance history
├── challenge-hint/              # Hint progression tracking
├── classroom/                   # Class data & membership
├── classroom-teacher-map/       # Teacher class relationships
├── credentials/                 # User profiles & auth
├── does-x-exist/                # Existence checks (email, username, pip-uuid)
├── find/                        # Entity lookups (user, career, challenge)
├── fill-in-the-blank/           # Question content & validation
├── function-to-block/           # Blockly assessment checks
├── lesson/                      # Educational content & sections
├── matching/                    # Matching question validation
├── sandbox-message/             # Sandbox chat history
├── sandbox-project-shares/      # Project sharing checks
├── sandbox_project/             # User projects & metadata
├── simultaneous-reads/          # Complex multi-table queries
└── student/                     # Student progress & enrollment
```

## Key Patterns

**Prisma Client Access**:
```typescript
const prismaClient = await PrismaClientClass.getPrismaClient()
const data = await prismaClient.table.findUnique({ where: {}, select: {} })
```

**Typed Results**: All queries return strict types (ExtendedCredentials, ProjectData, etc.) with type guards
- Validation: `validateExtendedCredentials(user)` type guards ensure data shape
- Null handling: Return null for not found, undefined for inactive records
- Error handling: Catch, log, and rethrow

**Select Optimization**: Specify fields needed, include relationships with nested selects
- Example: findUserById includes profile_picture, teacher nested relations
- Filters: Always include is_active checks where applicable
- Case-insensitive searches: Use `{ equals: value, mode: "insensitive" }` for usernames

**Common Where Conditions**:
- Single key: `{ user_id: userId, is_active: true }`
- Encrypted fields: `{ email__encrypted: { equals: encryptedEmail } }`
- Case-insensitive: `{ username: { equals: username, mode: "insensitive" } }`
- Conditional: Multiple branches (findUserByWhereCondition pattern)

## File Organization Strategy

**By Resource**: Each subdirectory = single entity type
- credentials/ → User account queries
- sandbox_project/ → Project data queries
- classroom/ → Class membership queries

**Naming Convention**: `retrieve-*`, `get-*`, `find-*`, `check-*`
- retrieve: Fetch full or detailed records
- get: Fetch simple/single values
- find: Search with flexible criteria
- check: Existence/validation checks

**Simultaneous-reads/**: Complex queries joining multiple tables
- Example: getUserCareerProgressData combines careers, challenges, completion status

## Common Query Patterns

**Find by ID**:
```typescript
await prisma.table.findUnique({
  where: { id: value },
  select: { field1: true, nested: { select: { field: true } } }
})
```

**Find by Condition**:
```typescript
await prisma.table.findFirst({
  where: { ...whereCondition, is_active: true },
  select: { ... }
})
```

**Existence Check**:
```typescript
await prisma.table.findFirst({
  where: { ...condition },
  select: { id: true }
})
// Return boolean or id
```

**List with Filters**:
```typescript
await prisma.table.findMany({
  where: { userId: ..., is_active: true },
  select: { ... }
})
```

## Integration Points

- **Controllers**: Import and call read functions with parameters
- **Middleware**: Confirmation middleware verifies resource existence
- **Services**: Singleton classes may use read ops internally
- **Types**: Return typed responses for type safety across codebase

## Best Practices

- **Always validate return types** - Use type guards before returning
- **Handle both not-found and inactive** - Return null vs undefined as appropriate
- **Select only needed fields** - Optimize query size with specific selects
- **Include active filters** - Don't accidentally return inactive records
- **Error handling** - Log before throwing for debugging
- **Consistent naming** - Follow retrieve/get/find/check conventions
- **Async/await** - All database operations async

## Error Handling

**Pattern**:
```typescript
try {
  const data = await prisma.query()
  return data
} catch (error) {
  console.error("Context:", error)
  throw error  // Let controller handle response
}
```

**Not Found**: Return null, controller sends 404
**Type Mismatch**: Type guard fails → return null
**Database Error**: Catch, log, rethrow for 500

## Important Notes

- **Read-only**: No mutations, side effects, or state changes
- **Lazy init**: PrismaClient loads on first call via getPrismaClient()
- **Type safety**: Validate all responses before returning
- **No business logic**: Pure data fetching, validation only
- **Stateless**: No caching, fresh queries each call
- **Active records**: Filter is_active true by default
- **Nullable**: Prepare for null returns everywhere

## Performance Considerations

- **Index on lookups**: user_id, email__encrypted, username indexed
- **Nested relations**: Keep depth reasonable (2-3 levels max)
- **Large result sets**: Consider pagination if retrieving many records
- **Select specificity**: Reduces payload size and query time
- **Query monitoring**: Watch for N+1 problems with nested selects

## Related Files

- `src/db-operations/write/` - Complementary write operations
- `src/classes/prisma-client.ts` - Prisma client singleton
- `src/types/` - Type definitions for read results
- `src/middleware/confirm/` - Verification middleware using reads
