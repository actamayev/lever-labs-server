# Lever Labs C++ Parser System

This directory contains the core C++ to ESP32 bytecode interpretation system that powers the educational robotics platform. The parser converts student-written C++ code into executable bytecode for a virtual machine running on physical robots.

## Architecture Overview

### Two-Class System
- **`CppParser`** (cpp-parser.ts): Main parser engine and orchestrator
- **`CppParserHelper`** (cpp-parser-helper.ts): Utility functions and instruction generation

### Core Pipeline
```
Raw C++ Code → Sanitization → Syntax Validation → Statement Parsing → Bytecode Generation → Float32Array
```

## File Breakdown

### CppParser (cpp-parser.ts)
**Main Entry Point**: `cppToByte(unsanitizedCpp: string): Float32Array`

#### Key Responsibilities
1. **Input Sanitization**: Uses `CppParserHelper.sanitizeUserCode()` to clean and prepare code
2. **Syntax Validation**: Validates balanced braces, parentheses, brackets via `CppParserHelper.validateBalancedSyntax()`
3. **Statement Parsing**: Core `parseCppCode()` method processes each C++ statement
4. **Size Validation**: Enforces `MAX_PROGRAM_SIZE` and `MAX_REGISTERS` limits
5. **Bytecode Generation**: Converts instruction objects to `Float32Array` via `CppParserHelper.generateBytecode()`

#### Statement Processing Engine
The parser uses a massive switch statement (52 cases) handling:
- **Variable declarations**: `int x = 5`, `float y = sensor.getValue()`, `bool detected = front_distance_sensor.is_object_in_front()`
- **Control flow**: `if/else/else-if` with complex conditions, `for` loops, `while` loops
- **LED control**: Individual LED manipulation, color presets, brightness control
- **Motor commands**: Forward/backward with throttle, turning, distance/time-based movement
- **Sensor operations**: Gyroscope, accelerometer, magnetometer, proximity sensors
- **Timing operations**: `wait()`, `waitForButton()`

#### Advanced Features
- **Compound conditions**: `if ((x > 5) && (y < 10))` and `if ((a == 1) || (b != 2))` support
- **Register allocation**: Automatic register management for variables and temporary values
- **Jump calculation**: Complex forward/backward jump offset calculation for control flow
- **Block nesting**: Stack-based tracking of nested `{}`/`for`/`while`/`if` blocks

### CppParserHelper (cpp-parser-helper.ts)
**Utility class** providing specialized parsing and generation functions.

#### Key Methods

**`sanitizeUserCode(userCode: string)`**
- Protects for-loop semicolons during processing
- Removes C++ comments (`//` and `/* */`)
- Normalizes braces and control structures
- Handles whitespace and special character escaping

**`validateBalancedSyntax(code: string)`**
- Stack-based validation of `()`, `{}`, `[]` matching
- Skips validation inside strings and comments
- Returns specific error messages with position information

**`identifyCommand(statement: string)`**
- Pattern matching against `CommandPatterns` enum
- Uses regex to extract command type and parameters
- Returns `ValidCommand` object with matches for processing

**`processOperand(expr, variables, nextRegister, instructions)`**
- Handles variable references, sensor calls, boolean literals, numeric constants
- Manages register allocation for temporary values
- Generates `READ_SENSOR` instructions for sensor operations
- Uses bit masking (`0x8000 | register`) to distinguish registers from constants

**`generateBytecode(instructions: BytecodeInstruction[])`**
- Converts instruction objects to `Float32Array`
- Each instruction = 5 Float32 values (opcode + 4 operands)
- Optimized for ESP32 VM consumption

## Critical Implementation Details

### Security Considerations
- **Input Sanitization**: Rigorous cleaning of user input to prevent injection
- **Regex Safety**: Uses secure patterns with ESLint security plugin enforcement
- **Bounds Checking**: Validates all numeric parameters (throttle %, degrees, etc.)
- **Resource Limits**: Enforces maximum program size and register count

### Performance Optimizations
- **Statement Splitting**: Efficient semicolon-based parsing with protected for-loop syntax
- **Register Reuse**: Minimal register allocation for temporary computations
- **Jump Optimization**: Calculated byte offsets for efficient VM execution
- **Bytecode Compression**: Dense Float32Array format minimizing transmission overhead

### Instruction Set Architecture
- **Opcode System**: Enum-based opcodes for type safety (`BytecodeOpCode`)
- **Four-Operand Instructions**: Standardized 4-parameter instruction format
- **Register-Based VM**: Register addressing with bit-masked register references
- **Jump Instructions**: Forward/backward jumps with distance validation

### Error Handling Strategy
- **Descriptive Messages**: Specific error messages with context information  
- **Early Validation**: Fail-fast approach catching errors during parsing phase
- **Resource Enforcement**: Hard limits preventing resource exhaustion on robot hardware

## Hardware Constraints

### ESP32 Limitations
- **Memory**: Limited RAM requires efficient bytecode representation
- **Processing**: ARM-based execution optimized for register operations
- **Real-time**: Deterministic execution timing for motor/sensor coordination
- **Power**: Battery-powered operation requiring efficient instruction execution

### Robot Platform Integration
- **Sensor Interface**: Direct hardware sensor reading via sensor type enumeration
- **Motor Control**: PWM-based motor control with percentage-based throttle
- **LED System**: RGB LED arrays with individual LED addressing capability
- **Button Input**: Hardware button integration for user interaction

## Development Guidelines

### Parser Modifications
- **Bytecode Impact**: All parser changes directly affect robot behavior - understand instruction set implications
- **Security First**: Validate all input patterns - educational users provide arbitrary code
- **Performance Critical**: Optimize for parsing speed and bytecode efficiency
- **Register Management**: Careful register allocation to stay within ESP32 constraints

### Testing Requirements
- **Edge Cases**: Test malformed C++, nested conditions, resource limits
- **Hardware Validation**: Changes should be tested on physical robot hardware
- **Coverage**: 100% test coverage required for all parsing logic
- **Bytecode Verification**: Validate generated bytecode produces correct robot behavior

### Pattern Matching
- **Regex Security**: All patterns reviewed for ReDoS vulnerabilities
- **Command Recognition**: Extend `CommandPatterns` enum for new C++ constructs  
- **Parameter Extraction**: Use capture groups for extracting command parameters
- **Validation**: All extracted parameters validated before instruction generation

## Type System Integration

### Enums and Constants
- **`BytecodeOpCode`**: VM instruction opcodes
- **`CommandType`**: C++ statement classification  
- **`SensorType`**: Physical sensor enumeration
- **`ComparisonOp`**: Comparison operator encoding
- **`VarType`**: Variable type system (int, float, bool)

### Data Structures
- **`BytecodeInstruction`**: Instruction representation with opcode + 4 operands
- **`VariableType`**: Variable metadata (type + register assignment)
- **`BlockStack`**: Control flow block tracking for nested structures
- **`PendingJumps`**: Jump instruction patching for control flow resolution

This parser system represents the critical bridge between educational C++ programming and physical robot execution, requiring deep understanding of both software interpretation techniques and embedded systems constraints.
