# Prisma Database Layer - Claude Instructions

## Overview
This directory contains the database schema definition (`schema.prisma`) and migration history (`migrations/`). Prisma ORM is the primary interface for all database operations.

## Schema Files

**schema.prisma**
- Complete PostgreSQL schema definition for the Lever Labs platform
- Includes all models: users, devices, projects, educational content, chat messages, etc.
- Configuration: PostgreSQL provider with connection pooling
- Seed data connector for local development database population

## Key Database Models

**User & Authentication**
- `users`: Core user accounts with email, authentication fields
- `user_notification_setting`: User preferences for notifications
- `user_session_data`: Session management data

**Hardware Integration**
- `pip_uuid`: ESP32 device definitions and metadata
- `user_pip_uuid_map`: Association between users and their devices
- Device telemetry and sensor data models

**Educational Content**
- `activities`: Structured learning activities
- `reading_sections`: Educational reading material
- `career`: Career quest system definitions
- `challenge`: Coding challenge definitions
- `sandbox_project`: User coding projects

**Chat & AI Integration**
- `career_message`: Chat history for career quest system
- `challenge_message`: Chat history for challenge solving
- `sandbox_message`: Chat history for sandbox projects

## Common Workflows

### Making Schema Changes

1. **Edit schema.prisma** with your model changes
2. **Switch to .env for migration**:
   ```bash
   cd /Users/arieltamayev/Documents/Lever-Labs/lever-labs-server
   mv .env.local .env
   ```
3. **Create migration**:
   ```bash
   sudo npx prisma migrate dev --name [descriptive_name]
   ```
4. **Switch back to .env.local**:
   ```bash
   mv .env .env.local
   ```
5. **Restart TypeScript server** in VS Code

### After Prisma Schema Changes

When you modify the schema:
```bash
npx prisma generate
```
This regenerates the Prisma client with updated types.

### Database Seed Data

Local development seed data is defined and applied during migrations:
```bash
npx prisma db seed
```

Production seeding (if needed):
```bash
pnpm run cloud-seed
```

## Migration Directory Structure

`migrations/` contains timestamped migration folders, each with:
- `migration.sql`: The actual SQL changes applied to the database
- `migration_lock.toml`: Lock file to prevent concurrent migrations

**Important**: Never manually edit migration files. Always create new migrations for changes.

## Development Database Access

**Local Development**
- Run migrations with `sudo npx prisma migrate dev`
- Interactive Prisma Studio: `npx prisma studio`
- Inspect data directly via Prisma Studio interface

**Testing Migrations**
- Always test schema changes locally before deploying
- Use `npx prisma migrate dev` to validate migration reversibility
- Review generated SQL in migration files before applying

## Production Deployment

When deploying schema changes to production:
```bash
# SSH into production server
npx prisma migrate deploy    # Apply pending migrations
npx prisma generate          # Regenerate Prisma client
pm2 restart 0                # Restart application
```

See `notes/aws.txt` for production deployment details.

## Type Generation

Prisma automatically generates TypeScript types from the schema:
- Types are available via `@prisma/client`
- Generated types stay in sync with schema via `npx prisma generate`
- Never manually edit generated type files

## Database Connection

Configuration via environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- Connection pooling configured in `schema.prisma`
- Managed through AWS RDS (production) or local PostgreSQL (development)

## Important Notes

- **Never commit `.env` files** - always use `.env.local` in development
- **Always create migrations** - direct schema changes without migrations will cause sync issues
- **Test migrations locally** before deploying to production
- **Prisma client regeneration** happens automatically, but run `npx prisma generate` if you see type errors
- **Database access requires authentication** - production access via SSH tunnel (see aws.txt)

## Troubleshooting

**"Unknown field after migration"**
- Run `npx prisma generate` to sync generated types with schema
- Restart TypeScript server in VS Code

**Migration conflicts**
- Check `migration_lock.toml`
- Ensure no other migration processes are running
- May need to reset development database: `npx prisma migrate reset`

**Connection issues**
- Verify DATABASE_URL in .env
- Check PostgreSQL is running locally or RDS is accessible
- For AWS: Verify security group allows your IP

**Prisma Studio won't connect**
- Ensure .env is properly configured
- Check PostgreSQL instance is running
- Run `npx prisma db push` if schema is out of sync
