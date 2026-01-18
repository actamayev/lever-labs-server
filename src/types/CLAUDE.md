# Types Directory - Claude Instructions

## Overview
This directory contains TypeScript type definitions for the entire Lever Labs server. These types provide type safety across the application, including database models, API requests/responses, socket events, and domain-specific types.

## Type Organization

### Core Domain Types

**auth.ts**
- Authentication-related types
- JWT payload structures
- User credential types

**chat.ts**
- Chat message types for all chat systems (career, challenge, sandbox)
- Message formatting and metadata
- AI response streaming types

**sandbox.ts**
- Sandbox coding project types
- Code execution and submission types
- Execution result types

**esp-socket.ts**
- ESP32 hardware communication types
- Device message protocols
- Sensor data structures
- Firmware update types

**socket.io.ts**
- Socket.IO event definitions
- Real-time communication types
- Browser-server and ESP32-device message types

### Data & Configuration Types

**seed-data.ts**
- Database seed data type definitions
- Reference data structures
- Bulk data population types

**bytecode.ts** and **bytecode-types.ts**
- Bytecode compilation and execution types
- Virtual machine types for sandbox execution
- Assembly/bytecode instruction types

**environment.ts**
- Environment variable type definitions
- Configuration type safety
- Runtime configuration validation

**prisma.ts**
- Type definitions for Prisma client integration
- Database model extensions if needed

**garage.ts**
- Garage/equipment management types
- Vehicle or device inventory types

**utils.ts**
- Utility type helpers and generic types
- Common type patterns used across codebase

**custom-express.ts**
- Extended Express types for custom middleware
- Request and response augmentations
- Custom error types

## Key Type Definition Patterns

### Creating New Type Definitions

1. **Determine appropriate file** - Create new file or add to existing if related
2. **Use consistent naming** - PascalCase for types, camelCase for variables
3. **Export from file** - All types should be exported for use throughout app
4. **Document complex types** - Add JSDoc comments for clarity

### Type Reuse Patterns

- **Database types**: Import from `@prisma/client` where applicable
- **API types**: Define request/response shapes separately from database types
- **Socket types**: Keep separate from HTTP types, group by event namespace
- **Validation**: Coordinate with Joi schemas in `src/middleware/request-validation/`

### Type Safety Best Practices

- Use strict TypeScript mode (enforced in `tsconfig.json`)
- Avoid `any` types - use `unknown` and narrow with guards
- Define discriminated unions for complex data shapes
- Use `readonly` for immutable structures
- Export types for use across modules

## Integration Points

**With Prisma**
- Prisma generates types from `schema.prisma`
- These types are separate from application domain types
- Create application types that wrap or extend Prisma types

**With Middleware Validation**
- Request validation schemas in `src/middleware/request-validation/`
- Coordinate types with Joi validation schemas
- Ensure type matches validation expectations

**With Controllers**
- Controllers use types from this directory
- Controllers consume request types and produce response types
- Keep controller logic typed using these definitions

**With Socket.IO**
- Socket event handlers use types defined here
- Keep socket message types organized by namespace/feature
- Document event payloads clearly

## Common Development Tasks

### Adding a New Type File

1. Create `src/types/[feature].ts`
2. Define all types related to that feature
3. Export types explicitly
4. Document complex types with JSDoc
5. Import and use throughout feature controllers/handlers

### Extending Existing Types

When modifying existing type files:
- Keep changes backward compatible if possible
- Update JSDoc if type behavior changes
- Check if multiple files depend on changed type
- Run `pnpm run type-check` to verify no breakage

### Creating Type Unions for Multiple Models

Use discriminated unions for event types or variable shapes:
```typescript
type ChatMessage = CareerMessage | ChallengeMessage | SandboxMessage;
```

## Type Validation Checklist

Before committing type changes:
- [ ] `pnpm run type-check` passes with no errors
- [ ] New types are properly exported
- [ ] Related files that use these types still compile
- [ ] JSDoc comments explain non-obvious types
- [ ] No unnecessary `any` or `unknown` without narrowing

## Troubleshooting

**"Type 'X' is not assignable to type 'Y'"**
- Check if types match between database model and application type
- Verify Prisma types are regenerated: `npx prisma generate`
- Look for version mismatches between Prisma schema and generated types

**"Cannot find module" when importing types**
- Ensure type is exported from its file
- Check file path is correct and relative paths resolve
- Verify TypeScript path aliases in `tsconfig.json` if using them

**Type errors after schema change**
- Schema changes require migration and type regeneration
- Run: `npx prisma generate`
- Restart TypeScript server in VS Code

## Important Notes

- **Never modify Prisma-generated types** - they're auto-generated from schema
- **Keep types organized** - related types in same file when possible
- **Document unclear types** - use JSDoc for complex structures
- **Export explicitly** - always use `export` keyword for public types
- **Coordinate with validation** - request types should match Joi validation schemas
- **Run type-check before commits** - `pnpm run type-check` must pass
