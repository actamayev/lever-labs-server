# src/middleware/request-validation Directory - Claude Instructions

## Overview
Request validation middleware organized by feature. Each subdirectory contains Joi schemas for validating request bodies, params, and queries before reaching controllers.

## Directory Structure

Auth, sandbox, career-quest, chat, personal-info, pip, student, teacher, garage, quest, and other feature-specific subdirectories.

## Pattern

```typescript
// validate-login.ts
const schema = Joi.object({
  contact: Joi.string().required(),
  password: Joi.string().min(8).required()
})

export default (req, res, next) => {
  const { error } = schema.validate(req.body)
  if (error) return res.status(400).json({ error: error.message })
  next()
}
```

## Common Schemas by Feature

**Auth**: validate-login, validate-register, validate-google-callback
**Sandbox**: validate-create-project, validate-save-code, validate-run-code
**Career**: validate-create-career-chat, validate-submit-challenge-code
**Chat**: validate-message, validate-create-chat
**Classroom**: validate-create-classroom, validate-join-classroom, validate-scoreboard-update

## Joi Field Patterns

```typescript
email: Joi.string().email().lowercase().trim().required()
username: Joi.string().alphanum().lowercase().min(3).max(30).required()
password: Joi.string().min(8).pattern(/[A-Z]/).pattern(/[0-9]/).required()
uuid: Joi.string().uuid().required()
classCode: Joi.string().length(6).alphanum().uppercase().required()
message: Joi.string().min(1).max(5000).required()
code: Joi.string().min(1).max(50000).required()
```

## Middleware Integration

```typescript
router.post(
  '/login',
  validateLogin,      // From this directory
  authController
)
```

## Error Response

```typescript
400: { error: "\"password\" length must be at least 8 characters long" }
```

## Reusable Validators

Common validators from `src/middleware/joi/`:
- `email-validator.ts`: Email format with lowercase
- `password-validator.ts`: Min 8 chars, strength requirements
- `username-validator.ts`: Alphanumeric, 3-30 chars
- `pip-uuid-validator.ts`: UUID v4 format
- `class-code-validator.ts`: 6-char alphanumeric

**Usage**:
```typescript
import emailValidator from '../../joi/email-validator'
Joi.object({ email: emailValidator.required() })
```

## Best Practices

- **Explicit files** - One schema per validation type
- **Clear names** - `validate-*.ts` prefix
- **Reuse validators** - Use shared validators from joi directory
- **Early validation** - Before controller execution
- **Informative errors** - Tell user what's wrong
- **Type coercion** - `.required()`, `.default()` appropriately

## Error Handling

**Validation failures**: 400 with Joi error message
**Type mismatches**: 400 if wrong type provided
**Missing fields**: 400 listing missing required fields

## Special Cases

**File size**: `Joi.binary().max(5 * 1024 * 1024)` for 5MB max
**Array items**: `Joi.array().items(Joi.object({...})).min(1).required()`
**Nested objects**: `Joi.object({nested: Joi.object({...})})`

## Important Notes

- **Request-only** - Validation before database access
- **Early exit** - Stop if invalid, don't reach controller
- **Clear messages** - Errors explain what's wrong
- **No side effects** - Validation doesn't modify data
- **Consistent 400** - All validation errors return 400 status

## Integration Points

- **Routes**: Applied to specific endpoints
- **Controllers**: Receive validated req.body/query/params
- **Joi directory**: Reuses common field validators
- **TypeScript types**: May parallel type definitions

## Related Patterns

- **JWT Middleware**: Authentication (separate)
- **Confirm Middleware**: Authorization (separate)
- **Attach Middleware**: Data enrichment (after validation)
