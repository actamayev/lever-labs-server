# src/controllers/workbench Directory - Claude Instructions

## Overview
This directory contains route handlers for the workbench system. These controllers manage code compilation, workspace state, and bytecode generation for device execution.

## Key Files

### compile-code.ts
**Purpose:** Compile C++ code to executable bytecode

**Function:**
```typescript
async function compileCode(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract code from request body
2. Validate code syntax
3. Invoke compiler (Arduino CLI or similar)
4. Generate bytecode/hex output
5. Return compiled bytecode or error

**Request:**
```typescript
{
  code: string,
  targetBoard: string  // e.g., "esp32"
}
```

**Response - Success:**
```typescript
{
  bytecode: string,
  size: number,
  warnings: string[]
}
```

**Response - Error:**
```typescript
{
  error: string,
  line: number,
  column: number,
  message: string
}
```

### get-workspace-state.ts
**Purpose:** Retrieve current workspace configuration and state

**Function:**
```typescript
async function getWorkspaceState(req: Request, res: Response): Promise<void>
```

**Response:**
```typescript
{
  projectId: string,
  boardType: string,
  optimizationLevel: "0" | "1" | "2" | "3",
  includeDebugInfo: boolean,
  lastCompiled: Date | null,
  compilationErrors: any[]
}
```

### set-optimization-level.ts
**Purpose:** Configure compiler optimization setting

**Function:**
```typescript
async function setOptimizationLevel(req: Request, res: Response): Promise<void>
```

**Request:**
```typescript
{
  optimizationLevel: "0" | "1" | "2" | "3"
}
```

**Levels:**
- `0`: No optimization (fastest compilation)
- `1`: Basic optimization
- `2`: Optimize for size (default)
- `3`: Optimize for speed

### set-board-type.ts
**Purpose:** Select target board/device type

**Function:**
```typescript
async function setBoardType(req: Request, res: Response): Promise<void>
```

**Request:**
```typescript
{
  boardType: string  // "esp32", "arduino-uno", etc.
}
```

### enable-debug-mode.ts
**Purpose:** Toggle debug information in compilation

**Function:**
```typescript
async function enableDebugMode(req: Request, res: Response): Promise<void>
```

**Request:**
```typescript
{
  debugEnabled: boolean
}
```

## Compilation System

### Compilation Flow
```typescript
1. User clicks "Compile"
2. POST /api/workbench/compile with code
3. Server validates syntax
4. Invokes compiler
5. Generates bytecode
6. Returns result or errors
7. UI shows status
```

### Error Reporting
- Line and column numbers
- Error descriptions
- Suggested fixes (if possible)
- Warnings separate from errors

### Bytecode Output
- Arduino/ESP32 hex format
- Size information
- Optimization metadata
- Device compatibility info

## Workspace Configuration

### Project Settings
```typescript
{
  projectId: string,
  boardType: string,
  optimizationLevel: string,
  debugMode: boolean,
  includeLibraries: string[],
  customFlags: string[]
}
```

### Compilation Cache
- Store compiled bytecode
- Recompile only if code changed
- Quick re-deployment

## Database Operations

### Read
- `getProjectSettings(projectId)` - Compilation config
- `getCachedBytecode(projectId, codeHash)` - Cache lookup

### Write
- `saveProjectSettings(projectId, settings)` - Update config
- `cacheBytecode(projectId, codeHash, bytecode)` - Cache result
- `recordCompilationError(projectId, error)` - Error log

## Error Handling

```typescript
// Compilation error
400: {
  error: "Compilation failed",
  line: 15,
  column: 8,
  message: "Variable not declared"
}

// Invalid board type
400: { error: "Invalid board type" }

// Code validation failed
400: { error: "Code contains unsafe operations" }

// Compiler unavailable
503: { error: "Compiler service unavailable" }

// Server error
500: { error: "Internal Server Error: ..." }
```

## Validation

### Code Analysis
- Syntax validation
- Type checking
- Unsafe operations detection
- Memory safety checks
- Loop safety (infinite loop prevention)

### Configuration Validation
- Valid board types
- Supported optimization levels
- Compatible library combinations

## Best Practices

- **Validate before compile** - Quick feedback
- **Cache bytecode** - Don't recompile unchanged
- **Clear error messages** - Line numbers, fixes
- **Compiler timeouts** - Kill long compilations
- **Memory limits** - Prevent runaway processes
- **Incremental compile** - Reuse object files

## Common Workflows

### Compiling Code
```typescript
1. User writes C++ code
2. Clicks "Compile" button
3. POST /api/workbench/compile
4. Server validates and compiles
5. Returns bytecode or errors
6. UI shows result
7. If success, can upload to device
```

### Configuring Workspace
```typescript
1. User opens project settings
2. Selects board type
3. Sets optimization level
4. Enables/disables debug
5. Clicks "Save"
6. Settings applied to future compiles
```

### Debugging
```typescript
1. Enable debug mode in settings
2. Compile with debug info
3. Debug symbols included in bytecode
4. Can use debugger on device
5. Breakpoints, variable inspection
```

## Real-time Features

### Compilation Feedback
- Progress indication
- Status updates
- Real-time error display

### Error Highlighting
- Code editor highlights errors
- Line/column precision
- Inline suggestions

## Performance Considerations

- **Incremental compilation** - Faster rebuilds
- **Distributed build** - Offload to build server
- **Compile timeout** - 30-60 seconds typical
- **Cache management** - Size limits
- **Parallel builds** - If multiple projects

## Important Notes

- **Board selection critical** - Affects binary compatibility
- **Code safety checked** - Prevents device damage
- **Optimization tradeoff** - Speed vs size vs compile time
- **Debug overhead** - Increases binary size
- **Cached builds** - Same code = instant compile

## Integration with Other Systems

### Compiler Infrastructure
- Arduino CLI or equivalent
- Target board support files
- Library includes
- Toolchain management

### Database Layer
- Project settings storage
- Build cache management
- Error history

### Code Analysis
- Syntax validation
- Safety checks
- Type system

### Type System
- Strong typing of settings
- Enum for optimization levels
- Bytecode format validation

### Middleware Layer
- Authentication required
- Project ownership verification
- Validation middleware
