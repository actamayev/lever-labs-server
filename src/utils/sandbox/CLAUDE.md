# src/utils/sandbox Directory - Claude Instructions

## Overview
This directory contains utility functions for sandbox code project management including code compilation, block formatting for display, and safety validation. These helpers support the sandbox coding environment where students write and test C++ code.

## Key Files

### block-formatter.ts
**Purpose:** Format coding blocks for display and LLM context

**Main Function:**
```typescript
class BlockFormatter {
  static formatBlocksForSandboxLLMContext(): string
  static formatBlocksForUI(): BlockDisplayData[]
  static getAvailableBlocks(): CodingBlock[]
}
```

**Usage:**
```typescript
import { BlockFormatter } from "../../utils/sandbox/block-formatter"

// For LLM context (markdown text)
const blocksText = BlockFormatter.formatBlocksForSandboxLLMContext()

// For UI display (structured data)
const blocksUI = BlockFormatter.formatBlocksForUI()

// Get all blocks
const allBlocks = BlockFormatter.getAvailableBlocks()
```

**Output Example:**
```
AVAILABLE BLOCKS:
• all_leds - Control RGB LED
  - set_color(color) - Set LED to specific color
  - turn_off() - Turn off LED

• move - Robot movement
  - forward(speed, duration) - Move forward
  - backward(speed, duration) - Move backward
```

**Used by:**
- LLM context builders to inform AI about available code blocks
- UI to display block palette to students
- Code validation to check for valid block usage

### sandbox-safety-measures.ts
**Purpose:** Validate and enforce safety constraints for sandbox code

**Functions:**
```typescript
function validateCodeSafety(code: string): SafetyValidationResult
function enforceLoopSafety(code: string): string
function checkExecutionTimeout(code: string): boolean
function validateMotorBounds(motorCommands: string[]): boolean
```

**Safety Checks:**
1. **Loop Safety** - Ensure loops have exit conditions
2. **Execution Timeout** - Prevent infinite loops
3. **Motor Bounds** - Limit motor power and duration
4. **Resource Usage** - Prevent excessive memory
5. **Dangerous Commands** - Block unsafe operations

**Usage:**
```typescript
import { validateCodeSafety } from "../../utils/sandbox/sandbox-safety-measures"

const result = validateCodeSafety(userCode)
if (!result.isSafe) {
  // Show error: result.errors
}
```

**Safety Violations:**
```typescript
interface SafetyValidationResult {
  isSafe: boolean
  errors: Array<{
    type: "loop" | "timeout" | "motor" | "resource"
    message: string
    line?: number
  }>
}
```

**Example Unsafe Code:**
```cpp
// Infinite loop - rejected
while (true) {
  all_leds.set_color(RED);
}

// No timeout - rejected
for (int i = 0; i < 1000000; i++) {
  move.forward(100, 1000);
}

// Safe version - accepted
for (int i = 0; i < 10; i++) {
  move.forward(50, 500);
  all_leds.set_color(RED);
  delay(100);
}
```

### camel-case-sandbox-project.ts
**Purpose:** Convert database sandbox project format to API response format

**Function:**
```typescript
function camelCaseSandboxProject(project: SandboxProjectDB): SandboxProjectAPI
```

**Transformation:**
```typescript
// Database format (snake_case)
{
  sandbox_project_id: 123,
  user_id: 456,
  project_name: "My Project",
  project_code: "all_leds.set_color(RED);",
  created_at: "2024-01-01T00:00:00Z"
}

// API format (camelCase)
{
  sandboxProjectId: 123,
  userId: 456,
  projectName: "My Project",
  projectCode: "all_leds.set_color(RED);",
  createdAt: "2024-01-01T00:00:00Z"
}
```

**Usage:**
```typescript
import camelCaseSandboxProject from "../../utils/sandbox/camel-case-sandbox-project"

const dbProject = await findSandboxProject(id)
const apiResponse = camelCaseSandboxProject(dbProject)
res.json(apiResponse)
```

## Sandbox Code Flow

**Typical Sandbox Interaction:**
```
1. Student writes C++ code
2. Code validated by sandbox-safety-measures
3. If safe: compiled to bytecode
4. Bytecode sent to device via SendEsp32MessageManager
5. Device executes code
6. Results streamed back to browser
7. Student can share or save project
```

## Code Compilation

**C++ to Bytecode Pipeline:**
```typescript
// Raw C++ code from student
const userCode = `
all_leds.set_color(RED);
move.forward(50, 500);
`

// 1. Validate safety
const safetyCheck = validateCodeSafety(userCode)
if (!safetyCheck.isSafe) throw new Error(safetyCheck.errors[0].message)

// 2. Compile to bytecode
const bytecode = await compileCppToBytecode(userCode)

// 3. Send to device
await SendEsp32MessageManager.getInstance().sendBytecodeToDevice(pipUUID, bytecode)
```

## Block System

### Available Blocks
- **LED Control** - Set colors, patterns, animations
- **Movement** - Forward, backward, turn, stop
- **Sensors** - Read distance, line detection, color
- **Logic** - If/else, loops, variables
- **Sound** - Play tones, frequencies

### Block Properties
```typescript
interface CodingBlock {
  id: string                    // "led_set_color"
  name: string                  // "Set LED Color"
  description: string           // "Set the RGB LED to a color"
  category: string              // "LED"
  parameters: Parameter[]       // [{name: "color", type: "color"}]
  cppCode: string              // "all_leds.set_color({color});"
  isBlock: boolean             // Can be used in block interface
  requiresManualSend: boolean  // User must click Send
}
```

## Working With Sandbox Projects

### Create Project
```typescript
const project = await createSandboxProject({
  userId: user.id,
  projectName: "Line Following",
  projectCode: "// Start here"
})
```

### Update Code
```typescript
const validated = validateCodeSafety(newCode)
if (validated.isSafe) {
  await updateSandboxProject(projectId, { projectCode: newCode })
}
```

### Execute Code
```typescript
// Validate
const safety = validateCodeSafety(code)

// Compile
const bytecode = await compileCppToBytecode(code)

// Send to device
await sendBytecodeToDevice(pipUUID, bytecode)

// Wait for results (via Socket.IO)
socket.on("executionResult", (result) => {
  console.log("Code execution complete:", result)
})
```

### Share Project
```typescript
const sharedProject = await shareSandboxProject(projectId, recipientUserId)
// Recipient can now view and run (not edit)
```

## Safety Philosophy

**Design Principles:**
- **Protect Hardware** - Prevent damage to physical robot
- **Prevent Crashes** - Ensure device doesn't freeze/reboot
- **Reasonable Limits** - Allow student experimentation
- **Clear Errors** - Tell students why code rejected
- **Learning Focus** - Safety shouldn't block learning

**Example Safety Rules:**
```
✅ Allow: Loops with explicit counter
❌ Block: while(true) loops

✅ Allow: Motor power 0-100
❌ Block: Negative or >100 values

✅ Allow: 5 second max execution
❌ Block: Longer operations

✅ Allow: Sensor reads
❌ Block: Hardware resets (if exposed)
```

## Best Practices

- **Always validate before sending to device** - Safety first
- **Provide helpful error messages** - Show line number and fix
- **Cache block data** - Load once, reuse across requests
- **Rate limit execution** - Prevent spam/DoS
- **Store code versions** - Enable undo/history
- **Test safety rules** - Unit test with malicious code
- **Update blocks documentation** - Keep in sync with firmware
- **Monitor execution** - Track failed/successful runs
- **Encourage exploration** - But maintain safety

## Troubleshooting

**Code won't compile**
- Check syntax errors in user code
- Verify all functions called exist
- Check parameter types match

**Code fails safety validation**
- Review specific safety error
- Suggest alternative approach
- Show working example

**Code runs but wrong output**
- Verify correct code sent to device
- Check device is connected
- Review execution on device side

**Performance issues**
- Check code complexity
- Limit number of active projects
- Cache frequently used blocks

## Important Notes

- **Safety is not optional** - Every code path must be validated
- **Device firmware limits** - Some code types may not be supported
- **Bytecode format** - Specific format required by device
- **Execution timeout** - Prevent infinite loops
- **Memory constraints** - Device has limited RAM
- **Testing critical** - Test safety rules thoroughly before release
