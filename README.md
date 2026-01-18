# Lever Labs Server

Backend server for an educational robotics platform built with Node.js/TypeScript. Features ESP32 hardware integration, real-time communication via WebSockets, AI-powered educational assistance, and a comprehensive learning management system.

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js + TypeScript |
| Framework | Express 5 |
| Database | PostgreSQL + Prisma ORM |
| Real-time | Socket.IO (browser) + WebSocket (ESP32) |
| AI | OpenAI / Grok integration |
| Cloud | AWS (S3, Secrets Manager, EC2, RDS) |
| Auth | JWT + Google OAuth |
| Validation | Joi |
| Testing | Jest + Supertest |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL database
- AWS credentials (for S3, Secrets Manager)

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
npx prisma generate

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Environment Configuration

Create `.env.local` for development:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/lever_labs"
JWT_SECRET="your-jwt-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
OPENAI_API_KEY="your-openai-key"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="your-bucket"
```

### Running the Server

```bash
# Development (with hot reload)
pnpm start

# Production build
pnpm run build
node dist/src/index.js
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm start` | Start dev server with nodemon |
| `pnpm run build` | Compile TypeScript + copy seed data |
| `pnpm run validate` | Run lint + type-check + tests |
| `pnpm run lint` | ESLint check |
| `pnpm run lint:fix` | Auto-fix ESLint issues |
| `pnpm run type-check` | TypeScript type checking |
| `pnpm test` | Run all tests |
| `pnpm run test:unit` | Run unit tests only |
| `pnpm run test:integration` | Run integration tests only |
| `pnpm run test:coverage` | Run tests with coverage report |

## Project Structure

```
src/
├── classes/              # Singleton services
│   ├── esp32/            # ESP32 device management
│   ├── browser-socket-manager.ts
│   ├── prisma-client.ts
│   └── ...
├── controllers/          # Route handlers by feature
│   ├── auth/             # Login, logout, OAuth
│   ├── sandbox/          # Code editor projects
│   ├── career-quest/     # Learning progression
│   ├── chat/             # AI chat endpoints
│   ├── pip/              # Device management
│   ├── teacher/          # Classroom management
│   └── ...
├── db-operations/        # Database access layer
│   ├── read/             # Query operations
│   └── write/            # Mutation operations
├── middleware/           # Express middleware
│   ├── jwt/              # Authentication
│   ├── request-validation/  # Input validation
│   ├── confirm/          # Authorization checks
│   └── attach/           # Data attachment
├── routes/               # Route definitions
├── types/                # TypeScript definitions
├── utils/                # Helper functions
│   ├── llm/              # AI context builders
│   └── ...
├── db-seed-data/         # Reference data (CSV/JSON)
└── prisma/               # Database schema & migrations
```

## Core Features

### ESP32 Hardware Integration

Two-channel WebSocket architecture for device communication:

- **Command Channel** (`/ws-command`): Send commands to devices
- **Sensor Channel** (`/ws-sensor`): Receive real-time sensor data

```
Browser ←→ Socket.IO ←→ Server ←→ WebSocket ←→ ESP32
```

Health monitoring via ping/pong every 750ms with 3-second timeout.

### Authentication

- **Local Auth**: Email/password with bcrypt hashing
- **Google OAuth**: Sign in with Google integration
- **JWT Tokens**: HTTP-only secure cookies
- **Session Management**: Stateless with cookie-based tokens

### Real-time Communication

Socket.IO handles browser connections for:
- AI chat message streaming
- Device status updates
- Classroom scoreboard broadcasts
- Firmware update progress

### AI Integration

OpenAI/Grok powers educational features:
- **Sandbox Chat**: Code assistance in the editor
- **Career Quest Chat**: Guided learning progression
- **Code Evaluation**: Automated challenge checking with scoring
- **Hints System**: Progressive hints without spoiling solutions

### Classroom System

- Teachers create classrooms with unique 6-character access codes
- Students join via code
- Real-time hubs for synchronized teaching sessions
- Live scoreboard during class activities

### Career Quest

Linear learning progression system:
- Careers contain ordered challenges
- Challenges have success criteria and optional solutions
- AI-powered feedback and hints
- Progress tracking per user

## Database

### Schema Overview

Key tables in PostgreSQL via Prisma:

| Table | Purpose |
|-------|---------|
| `credentials` | User accounts and preferences |
| `pip_uuid` | Registered ESP32 devices |
| `sandbox_project` | User coding projects |
| `career` / `challenge` | Learning content structure |
| `*_message` tables | Chat history (career, challenge, sandbox) |
| `classroom` / `student` | Classroom management |
| `teacher` | Teacher profiles and school associations |

### Migration Workflow

```bash
# 1. Rename env file for migration
mv .env.local .env

# 2. Create migration
sudo npx prisma migrate dev --name your_migration_name

# 3. Restore env file
mv .env .env.local

# 4. Regenerate client
npx prisma generate
```

### Seeding

```bash
# Local development
npx prisma db seed

# Production (after build)
pnpm run cloud-seed
```

Seed data lives in `src/db-seed-data/` as CSV and JSON files.

## API Patterns

### Request Flow

```
Request → Route → Validation Middleware → Auth Middleware →
Confirm Middleware → Attach Middleware → Controller → Response
```

### Adding a New Endpoint

1. **Define route** in `src/routes/[feature]-routes.ts`
2. **Add validation** in `src/middleware/request-validation/[feature]/`
3. **Implement controller** in `src/controllers/[feature]/`
4. **Add DB operations** in `src/db-operations/read/` or `write/`
5. **Define types** in `src/types/` if needed

### Error Responses

Standard error format:
```json
{
  "error": "Error message here"
}
```

HTTP status codes:
- `400`: Validation errors
- `401`: Authentication required
- `403`: Authorization denied
- `404`: Resource not found
- `500`: Server error

## Deployment

### Production (AWS EC2)

```bash
# SSH to server
ssh -i key.pem ec2-user@<ip>

# Deploy
git pull
pnpm install
pnpm run build
npx prisma migrate deploy
npx prisma generate
pm2 restart 0
```

### PM2 Commands

```bash
pm2 list              # Show processes
pm2 logs 0            # View logs
pm2 restart 0         # Restart server
pm2 monit             # Monitor dashboard
```

## Testing

```bash
# Run all tests
pnpm test

# Specific test suites
pnpm run test:unit
pnpm run test:integration
pnpm run test:parser

# Watch mode
pnpm run test:watch

# Coverage report
pnpm run test:coverage
```

## Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with security plugin
- **Validation**: All inputs validated via Joi schemas
- **Type Safety**: Comprehensive type definitions and guards

Run all checks:
```bash
pnpm run validate
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Prisma client errors | Run `npx prisma generate` |
| Unknown field errors | Check schema, run migration, regenerate |
| PM2 not responding | `pm2 restart 0` or check logs |
| WebSocket disconnects | Check network, verify device firmware |
| Auth failures | Verify JWT_SECRET matches, check cookie settings |

## License

MIT
