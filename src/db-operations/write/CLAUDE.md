# src/db-operations/write Directory - Claude Instructions

## Overview
Database mutations using Prisma: create, update, delete, upsert operations organized by resource type. Always use through controllers, never directly in route handlers.

## Directory Structure

```
write/
├── arcade-score/                # Game score recording
├── career-chat/                 # Career guidance chat persistence
├── career-message/              # Career message storage
├── career-user-progress/        # Career completion tracking
├── challenge-chat/              # Challenge assistance chat
├── challenge-code-submission/   # Code submission records
├── challenge-hint/              # Hint provision tracking
├── challenge-message/           # Challenge message storage
├── challenge-sandbox/           # Challenge project storage
├── classroom/                   # Class metadata updates
├── completed-user-lesson/       # Lesson completion tracking
├── credentials/                 # User account updates (theme, name, password)
├── email-update-subscriber/     # Newsletter subscription
├── login-history/               # Login attempt recording
├── pip-uuid/                    # Device registration
├── profile-picture/             # Avatar storage & lifecycle
├── sandbox-chat/                # Sandbox assistance chat
├── sandbox-message/             # Sandbox message storage
├── sandbox-project/             # User project CRUD
├── sandbox-project-shares/      # Project sharing management
├── simultaneous-writes/         # Multi-table atomic ops (classroom+teacher)
├── student/                     # Student progress (garage, garage states)
├── teacher/                     # Teacher profile updates
└── user-answer/                 # Assessment submission recording
```

## Key Patterns

**Prisma Client Access**:
```typescript
const prismaClient = await PrismaClientClass.getPrismaClient()
const result = await prismaClient.table.create({ data: {...} })
```

**Create Operations**:
```typescript
export async function addUser(data: NewUserFields): Promise<number> {
  const user = await prismaClient.credentials.create({ data })
  return user.user_id
}
```

**Update Operations**:
```typescript
await prismaClient.table.update({
  where: { id: recordId },
  data: { field: newValue }
})
```

**Upsert Pattern** (create if new, update if exists):
```typescript
await prismaClient.table.upsert({
  where: { unique_field: value },
  create: { ...initialData },
  update: { ...updateData }
})
```

**Delete Operations**: Mark inactive instead of hard delete
```typescript
await prismaClient.table.update({
  where: { id },
  data: { is_active: false }
})
```

## File Organization Strategy

**By Resource**: Each subdirectory = single entity type
- credentials/ → User account mutations
- sandbox-project/ → Project CRUD operations
- classroom/ → Class management mutations

**Naming Convention**: `add-*`, `update-*`, `create-*`, `mark-*-inactive`, `upsert-*`
- add: Create new record, return ID
- update: Modify existing field(s)
- create: Create with complex initialization
- mark-*-inactive: Soft delete pattern
- upsert: Create or update atomically

**Simultaneous-writes/**: Multi-table atomic operations
- Example: addClassroom creates classroom + maps to teacher in one transaction

## Error Handling

**Pattern**:
```typescript
try {
  const result = await prismaClient.operation()
  return result
} catch (error) {
  console.error("Context:", error)
  throw error  // Let controller handle response
}
```

**Common Errors**:
- Foreign key violation: Referenced record doesn't exist (404 from controller)
- Unique constraint: Duplicate value (409 Conflict from controller)
- Validation: Bad data (400 from controller)
- Database error: Catch, log, rethrow (500 from controller)

## Common Mutation Patterns

**Single Field Update**:
```typescript
await prismaClient.credentials.update({
  where: { user_id: userId },
  data: { default_site_theme: theme }
})
```

**Conditional Updates**:
```typescript
// Update multiple students' garage state
await prismaClient.student.updateMany({
  where: { classroom_id: classId },
  data: { garage_display_state: newState }
})
```

**Soft Delete**:
```typescript
await prismaClient.sandbox_project.update({
  where: { project_id: id },
  data: { is_active: false }
})
```

**Relationship Creation**:
```typescript
// Create chat and return ID
const chat = await prismaClient.career_chat.create({
  data: {
    user_id: userId,
    career_id: careerId,
    created_at: new Date()
  }
})
return chat.chat_id
```

## Transaction Pattern

For multi-step operations, use Prisma transactions:
```typescript
await prismaClient.$transaction(async (tx) => {
  await tx.table1.create({ data: {...} })
  await tx.table2.update({ where: {...}, data: {...} })
})
```

## Integration Points

- **Controllers**: Call write ops with validated parameters only
- **Middleware**: Confirmation middleware validates ownership before write
- **Services**: Singleton classes may use write ops (e.g., ScoreboardManager)
- **Database**: Migrations define schema, writes use table structure

## Best Practices

- **Always validate inputs in controller** - Don't trust client data
- **Soft delete by default** - Set is_active: false instead of delete()
- **Return ID on create** - Controllers need record ID for response
- **Handle foreign keys** - Ensure parent records exist before create
- **Atomic operations** - Use transactions for multi-step changes
- **Audit logging** - Track who changed what (login_history example)
- **Error context** - Log meaningful messages for debugging

## Important Notes

- **Write-only purpose**: These functions mutate database state only
- **No read logic**: Don't query in write functions, return minimal data
- **Controller responsibility**: Write functions execute, controllers decide response
- **Type safety**: Accept typed parameters, no string interpolation in queries
- **Lazy init**: PrismaClient loads via getPrismaClient()
- **No business logic**: Pure SQL operations, validation in controller/middleware
- **Soft deletes**: is_active: false preserves data integrity

## Data Consistency

- **Unique constraints**: Email, username, class codes enforced at DB level
- **Foreign keys**: Parent record must exist before child creation
- **Timestamps**: created_at, updated_at auto-managed by database
- **Idempotency**: Upsert used where repeated calls should be safe

## Performance Notes

- **Batch updates**: updateMany for bulk changes (classroom-wide updates)
- **Indexed columns**: user_id, email__encrypted, username for fast lookups
- **Avoid large returns**: Create/update return minimal data needed
- **Transaction overhead**: Use for multi-step ops only, not single queries

## Security Considerations

- **No raw SQL**: Always use Prisma for SQL injection prevention
- **Validate before write**: Input validation in middleware
- **Ownership checks**: Confirm middleware validates authorization
- **Soft deletes**: Preserve data for compliance/auditing
- **Encryption**: Handle encrypted fields (email__encrypted) properly

## Related Files

- `src/db-operations/read/` - Complementary read operations
- `src/classes/prisma-client.ts` - Prisma client singleton
- `src/middleware/confirm/` - Ownership verification middleware
- `src/controllers/` - Controllers call write functions
