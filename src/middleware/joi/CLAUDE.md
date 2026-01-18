# src/middleware/joi Directory - Claude Instructions

## Overview
Reusable Joi validation schemas exported for import across validation middleware. Eliminates duplication and ensures consistent validation rules.

## Core Concept

```typescript
// Single source of truth
// email-validator.ts
export default Joi.string()
  .email()
  .lowercase()
  .trim()
  .required()

// Used everywhere
import emailValidator from "../../joi/email-validator"
Joi.object({ email: emailValidator })
```

## Validator Files

### email-validator.ts
**Schema**: Valid email format, lowercase, trimmed, required
**Usage**: Login, registration, profile updates
```typescript
import emailValidator from "../../joi/email-validator"
Joi.object({ email: emailValidator })
```

### password-validator.ts
**Schema**: Min 8 chars, uppercase, number, required
**Constraints**: Strong password enforcement
```typescript
import passwordValidator from "../../joi/password-validator"
Joi.object({ password: passwordValidator })
```

### username-validator.ts
**Schema**: 3-30 alphanumeric chars, lowercase
**Constraints**: Unique check at database level, not here
```typescript
import usernameValidator from "../../joi/username-validator"
Joi.object({ username: usernameValidator })
```

### pip-uuid-validator.ts
**Schema**: UUID v4 format, required
**Constraints**: Validates device identifier format
```typescript
import pipUuidValidator from "../../joi/pip-uuid-validator"
Joi.object({ pipUUID: pipUuidValidator })
```

### class-code-validator.ts
**Schema**: Exactly 6 alphanumeric chars, uppercase
**Constraints**: Matches classroom access code format
```typescript
import classCodeValidator from "../../joi/class-code-validator"
Joi.object({ classCode: classCodeValidator })
```

### url-validator.ts
**Schema**: Valid HTTP/HTTPS URL
**Constraints**: For profile pictures, external links

### uuid-validator.ts
**Schema**: UUID v4 format (generic)
**Constraints**: For any UUID field (careerId, projectId, etc)

### positive-number-validator.ts
**Schema**: Integer > 0
**Constraints**: Scores, counts, quantities

### message-validator.ts
**Schema**: String 1-5000 chars
**Constraints**: Chat messages, user input

### code-validator.ts
**Schema**: String 1-50000 chars
**Constraints**: C++ code content

## Usage Pattern

### Single Field
```typescript
import emailValidator from "../../joi/email-validator"
const schema = Joi.object({
  email: emailValidator
})
```

### Multiple Fields
```typescript
import emailValidator from "../../joi/email-validator"
import passwordValidator from "../../joi/password-validator"
const schema = Joi.object({
  email: emailValidator,
  password: passwordValidator
})
```

### Optional Field
```typescript
email: emailValidator.optional()  // Make optional while keeping rules
```

### Array of Validated Items
```typescript
import uuidValidator from "../../joi/uuid-validator"
const schema = Joi.object({
  ids: Joi.array().items(uuidValidator).required()
})
```

## Design Principles

- **Single source of truth** - One definition per validation type
- **Reusable** - Import where needed
- **Consistent** - Same rules everywhere
- **Maintainable** - Change once, applies everywhere
- **Exportable** - Can be combined with `.optional()`, `.external()`, etc

## Best Practices

- **One validator per file** - Focus, clarity
- **Clear naming** - `*-validator.ts` suffix
- **Documented constraints** - Comments explain rules
- **No side effects** - Just validation, no database lookups
- **Composable** - Can be combined in other validators

## Common Patterns

**Optional variant**:
```typescript
// email-validator.ts exports required
// In schema use: emailValidator.optional()
```

**Conditional schema**:
```typescript
Joi.object().when('type', {
  is: 'email',
  then: Joi.object({ email: emailValidator }),
  otherwise: Joi.object({ username: usernameValidator })
})
```

**Alternative fields**:
```typescript
Joi.object().keys({
  email: emailValidator,
  username: usernameValidator
}).or('email', 'username')  // One of these required
```

## Integration Points

- **Request validation**: Each file imports relevant validators
- **Type definitions**: May parallel TypeScript types
- **Consistency**: Enforced across all endpoints
- **Error messages**: Joi defaults or custom messages

## Important Notes

- **Immutable defaults** - Validators don't change
- **Composable** - Can add modifiers (`.optional()`, etc)
- **Testable** - Can test validators in isolation
- **Maintainable** - Single place to update rules
- **No database** - Pure schema validation

## Related Patterns

- **Request validation**: Uses these validators
- **Type system**: May align with TypeScript types
- **Database validation**: Separate layer
- **Custom validators**: For business logic in request-validation
