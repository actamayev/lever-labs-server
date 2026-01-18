# src/controllers/health-checks Directory - Claude Instructions

## Overview
This directory contains route handlers for application health monitoring and status checks. These endpoints are used by load balancers, monitoring systems, and deployment orchestrators.

## Key Files

### check-health.ts
**Purpose:** Return application health status

**Function:**
```typescript
async function checkHealth(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Check database connectivity
2. Check critical services status
3. Check WebSocket servers
4. Gather metrics
5. Return health report

**Response - Healthy:**
```typescript
{
  status: "healthy",
  timestamp: Date,
  uptime: number,  // seconds
  services: {
    database: "connected",
    websocket: "operational",
    s3: "operational",
    redis: "operational"
  },
  metrics: {
    activeConnections: number,
    requestsPerSecond: number,
    averageResponseTime: number
  }
}
```

**Response - Degraded:**
```typescript
{
  status: "degraded",
  timestamp: Date,
  issues: [
    { service: "redis", status: "unreachable" }
  ]
}
```

**Response - Unhealthy:**
```typescript
{
  status: "unhealthy",
  timestamp: Date,
  issues: [
    { service: "database", status: "connection failed" }
  ]
}
```

### check-database-health.ts
**Purpose:** Verify database connectivity and performance

**Function:**
```typescript
async function checkDatabaseHealth(req: Request, res: Response): Promise<void>
```

**Checks:**
- Connection pool available
- Query execution time
- Replication lag (if applicable)
- Disk space

**Response:**
```typescript
{
  status: "healthy" | "degraded" | "unhealthy",
  connectionPool: {
    active: number,
    idle: number,
    max: number
  },
  queryTime: number,  // ms
  replicationLag: number  // seconds
}
```

### check-websocket-health.ts
**Purpose:** Verify WebSocket servers are operational

**Function:**
```typescript
async function checkWebsocketHealth(req: Request, res: Response): Promise<void>
```

**Checks:**
- Browser WebSocket server running
- ESP32 WebSocket servers running
- Active connections count
- Message throughput

**Response:**
```typescript
{
  status: "healthy" | "degraded" | "unhealthy",
  browserWss: {
    running: boolean,
    connections: number
  },
  esp32Wss: {
    running: boolean,
    connections: number,
    lastMessageTime: Date
  }
}
```

### check-external-services.ts
**Purpose:** Monitor external service connectivity

**Function:**
```typescript
async function checkExternalServices(req: Request, res: Response): Promise<void>
```

**Checks:**
- AWS S3 connectivity
- OpenAI API availability
- Google OAuth service
- Redis cache (if used)

**Response:**
```typescript
{
  s3: { status: "ok", responseTime: number },
  openai: { status: "ok", responseTime: number },
  google: { status: "ok", responseTime: number },
  redis: { status: "ok", responseTime: number }
}
```

## HTTP Status Codes

### Response Codes
- **200** - Healthy
- **503** - Service unavailable / Unhealthy
- **202** - Degraded (partial functionality)

### Used By
- Kubernetes probes (liveness, readiness, startup)
- Load balancers (ELB, ALB)
- Monitoring systems (DataDog, New Relic)
- Deployment orchestrators

## Health Check Types

### Liveness Probe
```typescript
// GET /health/live
// Used by orchestrators to restart unhealthy instances
// Should check: basic connectivity, memory
```

### Readiness Probe
```typescript
// GET /health/ready
// Used by load balancers to route traffic
// Should check: database, critical services
```

### Startup Probe
```typescript
// GET /health/startup
// Used during deployment/startup
// Should check: initialization complete
```

## Metrics Collection

### Application Metrics
- Request count
- Response times
- Error rates
- Active connections

### System Metrics
- Memory usage
- CPU usage
- Disk space
- Thread count

### Service Metrics
- Database pool utilization
- WebSocket connection count
- Message throughput
- API quota usage

## Error Handling

```typescript
// Service temporarily unavailable
503: {
  status: "unhealthy",
  issues: [{ service: "database", reason: "connection timeout" }]
}

// All services operational
200: {
  status: "healthy",
  timestamp: Date,
  uptime: 86400
}
```

## Database Operations

### Lightweight Checks
- Simple SELECT 1 query
- Connection pool status
- Query execution time

### Avoid Heavy Queries
- Don't scan large tables
- Don't lock resources
- Keep under 1 second timeout

## Integration Patterns

### Kubernetes Integration
```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Load Balancer Integration
```typescript
// AWS ALB target group
// Health check path: /health/ready
// Success codes: 200-299
// Timeout: 5s
// Interval: 30s
```

## Best Practices

- **Fast response time** - Under 500ms typical
- **Simple checks only** - Avoid expensive queries
- **Timeout protection** - Kill checks that hang
- **Separate endpoints** - Different probe types
- **Detailed logging** - Track health changes
- **Alerting** - Notify on status changes
- **Metrics export** - For monitoring systems

## Common Workflows

### Orchestrator Health Check
```typescript
1. Kubernetes periodically calls /health/live
2. Server responds quickly with liveness
3. If unhealthy, pod restarted
4. Prevents cascading failures
```

### Load Balancer Integration
```typescript
1. ALB calls /health/ready
2. Checks database, services
3. If healthy, requests routed here
4. If unhealthy, traffic diverted
5. Allows graceful drain
```

### Monitoring Alert
```typescript
1. Monitoring system polls /health
2. Collects metrics
3. If unhealthy trend detected
4. Alert sent to ops team
5. Investigation begins
```

## Performance Considerations

- **Caching** - Cache non-critical checks
- **Timeout** - Fail fast on hanging checks
- **Async checks** - Don't block critical checks
- **Resource limits** - Cap check frequency
- **Separate pool** - Dedicated connections for health

## Important Notes

- **Fast response required** - Orchestrators timeout quickly
- **Don't use for detailed checks** - Use separate monitoring
- **Include timestamp** - Track when check performed
- **Stateless** - Each check independent
- **Human readable** - Easy to debug
- **Metrics helpful** - Trending data

## Integration with Other Systems

### Database Layer
- Quick connectivity check
- Connection pool status
- Query performance baseline

### WebSocket Layer
- Server status check
- Connection count tracking
- Message throughput metrics

### External Services
- Timeout protection
- Error tracking
- Response time baseline

### Monitoring Layer
- Metrics export
- Trend analysis
- Alert triggering

### Middleware Layer
- No authentication required
- Rate limiting optional
- Separate timeout values
