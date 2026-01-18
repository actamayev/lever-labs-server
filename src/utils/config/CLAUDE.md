# src/utils/config Directory - Claude Instructions

## Overview
This directory contains configuration utility functions for setting up the application. These utilities handle environment loading, route setup, and CORS configuration.

## Key Files

### get-env-path.ts
**Purpose:** Determine correct environment file path based on environment

**Function:**
```typescript
function getEnvPath(): string
```

**Logic:**
```
NODE_ENV = production  → Load .env
NODE_ENV = staging     → Load .env.staging
NODE_ENV = development → Load .env.local (or .env)
Default                → .env.local
```

**Usage:**
```typescript
import getEnvPath from "../../utils/config/get-env-path"

const envPath = getEnvPath()
require("dotenv").config({ path: envPath })

// Now process.env has correct values
```

**Environment Files:**
- **`.env`** - Production (committed template only)
- **`.env.staging`** - Staging environment
- **`.env.local`** - Development (not committed)
- **`.env.test`** - Testing

**Important Note:**
Never commit actual `.env` or `.env.local` files with secrets. Only commit `.env` as template with placeholder values.

### get-allowed-origins.ts
**Purpose:** Get CORS-allowed origins based on environment

**Function:**
```typescript
function getAllowedOrigins(): string[]
```

**Returns:**
```typescript
// Development
["http://localhost:3000", "http://localhost:3001"]

// Staging
["https://staging.example.com"]

// Production
["https://example.com", "https://www.example.com"]
```

**Usage:**
```typescript
import getAllowedOrigins from "../../utils/config/get-allowed-origins"

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
```

**CORS Configuration:**
```typescript
// Allows requests from specific origins
// Prevents unauthorized cross-origin access
// Credentials: includes cookies/auth headers
```

### setup-routes.ts
**Purpose:** Mount all application routes on Express app

**Function:**
```typescript
function setupRoutes(app: Express): void
```

**Usage:**
```typescript
import setupRoutes from "../../utils/config/setup-routes"

setupRoutes(app)

// Now all routes mounted:
// GET  /api/auth/login
// POST /api/sandbox/projects
// etc.
```

**Routes Mounted:**
```
/api/auth/*           → authRoutes
/api/sandbox/*        → sandboxRoutes
/api/career-quest/*   → careerQuestRoutes
/api/chat/*           → chatRoutes
/api/pip/*            → pipRoutes
/api/personal-info/*  → personalInfoRoutes
/api/student/*        → studentRoutes
/api/garage/*         → garageRoutes
/api/arcade/*         → arcadeRoutes
/api/workbench/*      → workbenchRoutes
/api/quest/*          → questRoutes
/api/teacher/*        → teacherRoutes
/api/internal/*       → internalRoutes (private)
/health               → healthCheck
```

## Configuration Patterns

### Environment-Specific Setup
```typescript
// Load correct environment
const envPath = getEnvPath()
require("dotenv").config({ path: envPath })

// Setup CORS with allowed origins
const corsOrigins = getAllowedOrigins()

// Initialize app with config
const app = express()
app.use(cors({ origin: corsOrigins }))
```

### Multi-Environment Support
```typescript
// config/environments.ts
export const environments = {
  development: {
    debug: true,
    corsOrigins: ["http://localhost:3000"],
    databaseUrl: "postgres://localhost/lever_dev"
  },
  staging: {
    debug: false,
    corsOrigins: ["https://staging.example.com"],
    databaseUrl: process.env.DATABASE_URL_STAGING
  },
  production: {
    debug: false,
    corsOrigins: ["https://example.com"],
    databaseUrl: process.env.DATABASE_URL
  }
}

// Usage
const env = environments[process.env.NODE_ENV]
```

## Configuration Flow

**Application Startup:**
```
1. Set NODE_ENV
2. Get environment file path
3. Load environment variables
4. Initialize database
5. Setup CORS
6. Mount routes
7. Start server
```

**Example:**
```typescript
// index.ts
import getEnvPath from "./utils/config/get-env-path"
import getAllowedOrigins from "./utils/config/get-allowed-origins"
import setupRoutes from "./utils/config/setup-routes"

// 1. Load environment
const envPath = getEnvPath()
require("dotenv").config({ path: envPath })

// 2. Create app
const app = express()

// 3. Setup middleware
const origins = getAllowedOrigins()
app.use(cors({ origin: origins, credentials: true }))

// 4. Mount routes
setupRoutes(app)

// 5. Start server
app.listen(3000, () => {
  console.log("Server started on port 3000")
})
```

## Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL=postgres://user:pass@host:5432/database

# Authentication
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# External Services
OPENAI_API_KEY=sk-...

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Optional Variables
```bash
# Features
ENABLE_AI_HINTS=true
ENABLE_MULTIPLAYER=false

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# Performance
SOCKET_TIMEOUT=30000
CACHE_TTL=3600
```

## Best Practices

### Environment Configuration
```typescript
// ✅ Good: Centralized, typed configuration
export const config = {
  database: {
    url: process.env.DATABASE_URL,
    poolSize: parseInt(process.env.DB_POOL_SIZE || "10")
  },
  api: {
    port: parseInt(process.env.PORT || "3000"),
    origins: getAllowedOrigins()
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    expiry: process.env.JWT_EXPIRY || "7d"
  }
}

// Validate
if (!config.auth.jwtSecret) {
  throw new Error("JWT_SECRET not set")
}
```

### Type-Safe Configuration
```typescript
// ✅ Good: Type-safe with validation
interface AppConfig {
  database: { url: string }
  api: { port: number; origins: string[] }
  auth: { secret: string }
}

function loadConfig(): AppConfig {
  const config: AppConfig = {
    database: { url: process.env.DATABASE_URL! },
    api: { port: 3000, origins: getAllowedOrigins() },
    auth: { secret: process.env.JWT_SECRET! }
  }

  // Validate
  if (!config.database.url) throw new Error("DATABASE_URL required")
  if (!config.auth.secret) throw new Error("JWT_SECRET required")

  return config
}
```

## Troubleshooting

**Environment variables not loading**
- Check `.env` file exists
- Verify file path from `getEnvPath()`
- Check NODE_ENV is set
- Verify dotenv is loaded before use

**CORS errors**
- Check origin is in `getAllowedOrigins()`
- Verify credentials flag if needed
- Check browser dev tools for actual origin
- Add to allowed origins if legitimate

**Routes not found**
- Check `setupRoutes()` called
- Verify route files imported
- Check route paths in documentation
- Review network tab for actual request path

**Wrong environment loaded**
- Check NODE_ENV value
- Verify environment file exists
- Check `getEnvPath()` logic
- Look at loaded variables: `console.log(process.env)`

## Important Notes

- **Environment file hierarchy** - `.env.local` overrides `.env`
- **Never commit secrets** - Use `.gitignore` for env files
- **Validate on startup** - Fail fast if config invalid
- **Type your config** - Catch errors at compile time
- **Document requirements** - List required env vars
- **Different per environment** - Different configs for dev/staging/prod
- **Secrets management** - Consider AWS Secrets Manager
- **Hot reload careful** - Some config changes need restart
