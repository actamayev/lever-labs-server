/* eslint-disable security/detect-unsafe-regex */
/* eslint-disable max-len */
export enum BytecodeOpCode {
    NOP = 0x00,
    END = 0x01,
    DELAY = 0x02,
    SET_LED = 0x10,
    SET_ALL_LEDS = 0x11,

    READ_SENSOR = 0x20,  // Read sensor value into register

    COMPARE = 0x30,       // Compare values
    JUMP = 0x31,          // Unconditional jump
    JUMP_IF_TRUE = 0x32,  // Jump if comparison was true
    JUMP_IF_FALSE = 0x33, // Jump if comparison was false
    WHILE_START = 0x34,
    WHILE_END = 0x35,

    FOR_INIT = 0x36,     // Initialize loop counter
    FOR_CONDITION = 0x37, // Check loop condition
    FOR_INCREMENT = 0x38, // Increment loop counter
    JUMP_BACKWARD = 0x39,  // Backward jump (for loops)

    DECLARE_VAR = 0x40,
    SET_VAR = 0x41,

    MOTOR_FORWARD = 0x50,   // Forward movement at specified throttle
    MOTOR_BACKWARD = 0x51,  // Backward movement at specified throttle
    MOTOR_STOP = 0x52,      // Stop all motors
    MOTOR_TURN = 0x53,      // Turn by specified degrees

    MOTOR_FORWARD_TIME = 0x54,
    MOTOR_BACKWARD_TIME = 0x55,

    MOTOR_FORWARD_DISTANCE = 0x56,
    MOTOR_BACKWARD_DISTANCE = 0x57,
}

export enum ComparisonOp {
    EQUAL = 0x01,          // ==
    NOT_EQUAL = 0x02,      // !=
    GREATER_THAN = 0x03,   // >
    LESS_THAN = 0x04,      //
    GREATER_EQUAL = 0x05,  // >=
    LESS_EQUAL = 0x06,     // <=
}

export enum VarType {
    FLOAT = 0x01,
    INT = 0x02,
    BOOL = 0x03,
}

export enum LedID {
    ALL = 0,
    TOP_LEFT = 1,
    TOP_RIGHT = 2,
    MIDDLE_LEFT = 3,
    MIDDLE_RIGHT = 4,
    BACK_LEFT = 5,
    BACK_RIGHT = 6
}

export enum SensorType {
    PITCH = 0,
    ROLL = 1,
    YAW = 2,
    ACCEL_X = 3,
    ACCEL_Y = 4,
    ACCEL_Z = 5,
    ACCEL_MAG = 6,
    ROT_RATE_X = 7,
    ROT_RATE_Y = 8,
    ROT_RATE_Z = 9,
    MAG_FIELD_X = 10,
    MAG_FIELD_Y = 11,
    MAG_FIELD_Z = 12
}

export enum CommandType {
    TURN_LED_OFF = "TURN_LED_OFF",
    SET_LED_RED = "SET_LED_RED",
    SET_LED_GREEN = "SET_LED_GREEN",
    SET_LED_BLUE = "SET_LED_BLUE",
    SET_LED_WHITE = "SET_LED_WHITE",
    SET_LED_PURPLE = "SET_LED_PURPLE",
    SET_ALL_LEDS = "SET_ALL_LEDS",
    SET_TOP_LEFT_LED = "SET_TOP_LEFT_LED",
    SET_TOP_RIGHT_LED = "SET_TOP_RIGHT_LED",
    SET_MIDDLE_LEFT_LED = "SET_MIDDLE_LEFT_LED",
    SET_MIDDLE_RIGHT_LED = "SET_MIDDLE_RIGHT_LED",
    SET_BACK_LEFT_LED = "SET_BACK_LEFT_LED",
    SET_BACK_RIGHT_LED = "SET_BACK_RIGHT_LED",
    DELAY = "DELAY",

    VARIABLE_ASSIGNMENT = "VARIABLE_ASSIGNMENT",

    IF_STATEMENT = "IF_STATEMENT",
    COMPOUND_AND_IF_STATEMENT = "COMPOUND_AND_IF_STATEMENT",
    COMPOUND_OR_IF_STATEMENT = "COMPOUND_OR_IF_STATEMENT",
    ELSE_STATEMENT = "ELSE_STATEMENT",
    BLOCK_START = "BLOCK_START",
    BLOCK_END = "BLOCK_END",
    WHILE_STATEMENT = "WHILE_STATEMENT",
    FOR_STATEMENT = "FOR_STATEMENT",
    SENSOR_READ = "SENSOR_READ",

    MOTOR_FORWARD = "MOTOR_FORWARD",
    MOTOR_BACKWARD = "MOTOR_BACKWARD",
    MOTOR_STOP = "MOTOR_STOP",
    MOTOR_TURN = "MOTOR_TURN",

    MOTOR_FORWARD_TIME = "MOTOR_FORWARD_TIME",
    MOTOR_BACKWARD_TIME = "MOTOR_BACKWARD_TIME",

    MOTOR_FORWARD_DISTANCE = "MOTOR_FORWARD_DISTANCE",
    MOTOR_BACKWARD_DISTANCE = "MOTOR_BACKWARD_DISTANCE",
}

// Command patterns for validation
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CommandPatterns: Record<CommandType, RegExp> = {
	[CommandType.TURN_LED_OFF]: /^rgbLed.turn_led_off\(\)$/,
	[CommandType.SET_LED_RED]: /^rgbLed.set_led_red\(\)$/,
	[CommandType.SET_LED_GREEN]: /^rgbLed.set_led_green\(\)$/,
	[CommandType.SET_LED_BLUE]: /^rgbLed.set_led_blue\(\)$/,
	[CommandType.SET_LED_WHITE]: /^rgbLed.set_led_white\(\)$/,
	[CommandType.SET_LED_PURPLE]: /^rgbLed.set_led_purple\(\)$/,
	[CommandType.SET_ALL_LEDS]: /^set_all_leds_to_color\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
	[CommandType.SET_TOP_LEFT_LED]: /^rgbLed\.set_top_left_led\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
	[CommandType.SET_TOP_RIGHT_LED]: /^rgbLed\.set_top_right_led\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
	[CommandType.SET_MIDDLE_LEFT_LED]: /^rgbLed\.set_middle_left_led\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
	[CommandType.SET_MIDDLE_RIGHT_LED]: /^rgbLed\.set_middle_right_led\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
	[CommandType.SET_BACK_LEFT_LED]: /^rgbLed\.set_back_left_led\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
	[CommandType.SET_BACK_RIGHT_LED]: /^rgbLed\.set_back_right_led\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
	[CommandType.DELAY]: /^delay\(\s*(\d+)\s*\)$/,

	[CommandType.VARIABLE_ASSIGNMENT]: /^(float|int|bool)\s+(\w+)\s*=\s*(.+)$/,

	[CommandType.IF_STATEMENT]: /^if\s*\(\s*(Sensors::getInstance\(\)\.\w+\(\)|[-\d.]+|\w+)\s*([<>=!][=]?)\s*(Sensors::getInstance\(\)\.\w+\(\)|[-\d.]+|\w+)\s*\)$/,
	[CommandType.COMPOUND_AND_IF_STATEMENT]: /^if\s*\(\s*\(\s*(Sensors::getInstance\(\)\.\w+\(\)|[-\d.]+|\w+)\s*([<>=!][=]?)\s*(Sensors::getInstance\(\)\.\w+\(\)|[-\d.]+|\w+)\s*\)\s*&&\s*\(\s*(Sensors::getInstance\(\)\.\w+\(\)|[-\d.]+|\w+)\s*([<>=!][=]?)\s*(Sensors::getInstance\(\)\.\w+\(\)|[-\d.]+|\w+)\s*\)\s*\)$/,
	[CommandType.COMPOUND_OR_IF_STATEMENT]: /^if\s*\(\s*\(\s*(Sensors::getInstance\(\)\.\w+\(\)|[-\d.]+|\w+)\s*([<>=!][=]?)\s*(Sensors::getInstance\(\)\.\w+\(\)|[-\d.]+|\w+)\s*\)\s*\|\|\s*\(\s*(Sensors::getInstance\(\)\.\w+\(\)|[-\d.]+|\w+)\s*([<>=!][=]?)\s*(Sensors::getInstance\(\)\.\w+\(\)|[-\d.]+|\w+)\s*\)\s*\)$/,
	[CommandType.ELSE_STATEMENT]: /^else$/,
	[CommandType.BLOCK_START]: /^{$/,
	[CommandType.BLOCK_END]: /^}$/,
	[CommandType.WHILE_STATEMENT]: /^while\s*\(\s*true\s*\)$/,
	[CommandType.FOR_STATEMENT]: /^for\s*\(\s*int\s+(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)\s*;\s*\1\s*\+\+\s*\)$/,
	[CommandType.SENSOR_READ]: /^Sensors::getInstance\(\)\.(\w+)\(\)$/,

	[CommandType.MOTOR_FORWARD]: /^goForward\(\s*(\d+)\s*\)$/,
	[CommandType.MOTOR_BACKWARD]: /^goBackward\(\s*(\d+)\s*\)$/,
	[CommandType.MOTOR_STOP]: /^stopMotors\(\)$/,
	[CommandType.MOTOR_TURN]: /^turn\(\s*(CLOCKWISE|COUNTERCLOCKWISE)\s*,\s*(\d+)\s*\)$/,

	[CommandType.MOTOR_FORWARD_TIME]: /^goForwardTime\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+)\s*\)$/,
	[CommandType.MOTOR_BACKWARD_TIME]: /^goBackwardTime\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+)\s*\)$/,

	[CommandType.MOTOR_FORWARD_DISTANCE]: /^goForwardDistance\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+)\s*\)$/,
	[CommandType.MOTOR_BACKWARD_DISTANCE]: /^goBackwardDistance\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+)\s*\)$/,
}
