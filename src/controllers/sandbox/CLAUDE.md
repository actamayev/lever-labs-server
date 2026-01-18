# src/controllers/sandbox Directory - Claude Instructions

## Overview
Route handlers for sandbox code editor: project management, code editing, and device execution.

## Key Controllers

### create-sandbox-project.ts
**Purpose**: Create new blank sandbox project
**Workflow**: Extract userId → Call DB → Return project
**Response**: `{ sandboxProject: { id, userId, name, code, createdAt, updatedAt } }`

### delete-sandbox-project.ts
**Purpose**: Delete sandbox project
**Route**: `DELETE /api/sandbox/projects/:projectId`
**Verify**: User owns project (middleware)
**Response**: `{ success: "" }`

### edit-sandbox-project-name.ts
**Purpose**: Update project name
**Request**: `{ newName: string }`

### edit-sandbox-project-code.ts
**Purpose**: Update project code
**Workflow**: Extract project → Validate safety → Update DB
**Safety checks**: Loop detection, motor bounds, memory safety, execution timeouts

### retrieve-sandbox-projects.ts
**Purpose**: Get all user projects
**Response**: Array of project objects

### run-sandbox-code.ts
**Purpose**: Execute code on connected device
**Workflow**: Validate code → Format binary → Send to ESP32 → Stream results

## Code Validation

**Safety checks**: Loop detection (infinite loops, timeouts), motor bounds (0-255), memory safety (array bounds, stack overflow), execution timeouts

**Utilities**: `src/utils/sandbox/sandbox-safety-measures.ts`, `block-formatter.ts`

## ESP32 Integration

**Flow**: Receive code → Validate → Format binary → Send via command WebSocket → Device executes → Stream results back

**Device Communication**: SendEsp32MessageManager singleton, command/sensor channels, heartbeat handling

## Middleware Pipeline

Auth verification → Validate code → Confirm project ownership → Confirm device connected → Controller

## Database Operations

**Read**: Find project, get all user projects, project code
**Write**: Create project, update code/name, delete project

## Error Handling

- **Project not found**: 404 { error: "Project not found" }
- **Not authorized**: 403 { error: "Not authorized to access this project" }
- **Device not connected**: 400 { error: "Device not connected" }
- **Code validation failed**: 400 { error: "Code safety check failed: {reason}" }
- **Server error**: 500 { error: "Internal Server Error: ..." }

## Integration Patterns

**Editing workflow**: Load project → Modify code → Save → DB updated → UI confirms

**Running code**: Write code → Click "Run" → Validate safety → Send to device → Real-time results in UI → Execution complete

**Project management**: Create → Edit → Save → Delete workflow

## LLM Integration

**Chat system**: buildSandboxLLMContext builds message array with system prompt (mentor role), recent history (30 messages), current code, user message

**Code review**: AI provides hints without spoiling solutions

## Real-time Features

- **Execution feedback**: Real-time sensor data streams
- **Error display**: Immediate validation feedback
- **Status updates**: Device communication status

## Best Practices

- **Validate all code** - Safety checks before execution
- **Verify ownership** - Project access control
- **Handle disconnections** - Device may disconnect during execution
- **Stream responses** - Real-time code output
- **Async operations** - Non-blocking database writes
- **Error recovery** - Clear error messages

## Common Workflows

**Create project**: Click "New" → POST /api/sandbox/projects → Browser navigates to editor

**Run code**: Write code → Click "Run" → POST /api/sandbox/projects/:id/run → Device executes → Results stream

**Save project**: Modify code → Click "Save" → PUT /api/sandbox/projects/:id → DB updated → UI confirms

## Performance

- **Code caching** - Cache recently run code
- **Query optimization** - Index on userId for project lists
- **Batch operations** - Multiple updates in transaction
- **Stream large outputs** - Don't buffer entire execution output

## Troubleshooting

**Code execution times out**: Check device connected, verify code doesn't loop infinitely, check device responsiveness

**Project not found**: Verify project ID, check user ownership, verify project exists, check deletion race conditions

**Code validation rejects valid code**: Review safety check logic, test specific patterns, check bounds reasonable

**Device disconnects during execution**: Handle in error response, provide user feedback, clean up execution state

## Important Notes

- **Code persistent** - Saved projects survive server restarts
- **Execution temporary** - Runtime state not preserved
- **Device required** - Can't run code without connected ESP32
- **Safety first** - Strict validation prevents device damage
- **No network access** - Code runs locally on device
- **Single active device** - Only one active connection per user

## Integration Points

- **Database**: All projects persisted, user-project relationship maintained
- **Device**: Code execution via ESP32, real-time communication via WebSocket
- **Chat**: Sandbox chat can reference current code, LLM context includes project code
- **Types**: Strong typing of project objects, code format validation
- **Middleware**: Authentication, project ownership verification, device availability checking
