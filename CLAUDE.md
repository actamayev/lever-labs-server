# Blue Dot Robots Server - Claude Instructions

## Project Overview
Educational robotics platform server built with Node.js/TypeScript, featuring ESP32 hardware integration, real-time communication, and AI-powered educational content.

**Core Technologies:**
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.IO (browser + ESP32 connections)
- **AI**: OpenAI integration for educational chat
- **Cloud**: AWS (S3, Secrets Manager, EC2, RDS)
- **Hardware**: ESP32 microcontroller integration

## Architecture Pattern
```
src/
├── classes/           # Singleton services (AWS, OpenAI, Socket managers)
├── controllers/       # Route handlers organized by feature
├── db-operations/     # Database CRUD operations (read/, write/)
├── middleware/        # Express middleware (validation, auth, etc.)
├── routes/           # Route definitions by feature
├── types/            # TypeScript type definitions
└── utils/            # Helper functions and utilities
```

## Key Development Commands

### Code Quality & Validation
```bash
npm run validate          # Run both lint and type-check
npm run lint             # ESLint check
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript type checking
```

### Build & Deploy
```bash
npm run build           # TypeScript compile + copy seed data
npm start               # Development with nodemon
```

### Database Operations
```bash
# Development (rename .env.local to .env first)
sudo npx prisma migrate dev --name [operation_name]
sudo npx prisma generate   # After schema changes
npx prisma db seed        # Seed reference data locally

# Production deployment (see notes/aws.txt)
npx prisma migrate deploy && npx prisma generate && pm2 restart 0
npm run cloud-seed       # Seed in cloud
```

## Critical Development Patterns

### Database Operations Structure
- **Read operations**: `src/db-operations/read/[table]/`
- **Write operations**: `src/db-operations/write/[table]/`
- Always use Prisma client through `src/classes/prisma-client.ts`
- Follow existing naming conventions: `kebab-case` for files

### Request Validation Pipeline
1. **Route**: Define endpoint in `src/routes/[feature]-routes.ts`
2. **Validation**: Add middleware in `src/middleware/request-validation/[feature]/`
3. **Controller**: Handle logic in `src/controllers/[feature]/`
4. **Types**: Define in `src/types/` if needed

### ESP32 Integration
- Socket connections managed via `src/classes/esp32/esp32-socket-manager.ts`
- Individual connections: `src/classes/esp32/single-esp32-connection.ts`
- Message handling: `src/classes/esp32/send-esp32-message-manager.ts`
- Firmware updates: `src/classes/esp32/esp-latest-firmware-manager.ts`

### Authentication & Authorization
- JWT tokens via `src/middleware/jwt/`
- Google OAuth integration in `src/controllers/auth/`
- User session management with cookies

## Important Database Schema Notes

**Key Tables:**
- `users`: Main user accounts
- `pip_uuid`: ESP32 device identifiers  
- `user_pip_uuid_map`: User-device relationships
- `sandbox_project`: User's coding projects
- `activities`, `reading_sections`: Educational content
- `career`, `challenge`: Career quest system
- Chat tables: `career_message`, `challenge_message`, `sandbox_message`

**Migration Workflow:**
1. Edit `prisma/schema.prisma`
2. Rename `.env.local` → `.env` 
3. Run `sudo npx prisma migrate dev --name [operation]`
4. Rename `.env` → `.env.local`
5. Restart TS server in VS Code

## Deployment & Environment

### AWS Infrastructure
- **Staging**: EC2 `i-0151f137cb9067c1c` (34.229.209.115)
- **Production**: EC2 `i-0af414ad7e5d89c3e` (54.81.65.153)
- **Database**: RDS PostgreSQL
- **Process Manager**: PM2 for server processes

### Deploy Workflow
1. `npm run build` locally
2. SCP files to EC2 (see `notes/aws.txt` for commands)
3. SSH into instance: `aws ec2-instance-connect ssh --instance-id [id] --os-user ubuntu`
4. Navigate to app directory: `cd blue-dot-robots/`
5. Install deps: `npm i --production`
6. Restart: `pm2 restart 0 && pm2 logs`

### Database Access
- **Staging**: PGAdmin
- **Production**: SSH tunnel + psql (see `notes/aws.txt`)

## Socket.IO Architecture

**Two Connection Types:**
1. **Browser Sockets**: User interface connections (`src/classes/browser-socket-manager.ts`)
2. **ESP32 Sockets**: Hardware device connections (`src/classes/esp32/esp32-socket-manager.ts`)

**Event Patterns:**
- Real-time sensor data streaming
- Firmware update progress
- Chat message streaming (OpenAI)
- Device control commands

## AI Integration Patterns

**OpenAI Usage:**
- Educational chat in career quest system
- Code checking and hints for challenges
- Sandbox project assistance
- Context building in `src/utils/llm/` directory

**Chat System:**
- Streaming responses via Socket.IO
- Message history persistence
- Context-aware conversations per feature area

## Common Development Tasks

### Adding New API Endpoint
1. Define route in `src/routes/[feature]-routes.ts`
2. Create validation middleware in `src/middleware/request-validation/[feature]/`
3. Implement controller in `src/controllers/[feature]/`
4. Add database operations if needed
5. Update types in `src/types/`

### Adding Database Table
1. Update `prisma/schema.prisma`
2. Create migration (follow migration workflow above)
3. Add seed data to `src/db-seed-data/` if needed
4. Create read/write operations in `src/db-operations/`

### ESP32 Feature Development  
1. Define message types in `src/types/esp-socket.ts`
2. Add handling in ESP32 socket manager
3. Update firmware manager if needed
4. Test with actual hardware

## Code Quality Standards

- **TypeScript**: Strict mode, comprehensive typing
- **Validation**: All inputs validated via Joi schemas
- **Error Handling**: Consistent error responses
- **Security**: Input sanitization, SQL injection prevention
- **Authentication**: JWT + secure cookie sessions

## Troubleshooting

### Common Issues
- **Prisma client not initialized**: Run `npx prisma generate`
- **Unknown field after migration**: Check field exists in DB, run `npx prisma generate`
- **PM2 issues**: `pm2 restart 0` or check `pm2 logs`
- **Package cleanup**: Run `depcheck` periodically

### Debug Commands
```bash
pm2 list                # Show running processes
pm2 logs [app_id]      # View process logs
pm2 restart [app_id]   # Restart specific process
```

## Important Notes

- **Environment Files**: Use `.env.local` for development, `.env` only during migrations
- **Package Updates**: Run `sudo npm update @bluedotrobots/common-ts` for common library
- **Code Style**: Follow existing patterns, use kebab-case for files
- **Security**: Never commit secrets, use AWS Secrets Manager
