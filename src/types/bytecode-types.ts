/* eslint-disable security/detect-unsafe-regex */
/* eslint-disable max-len */
export enum BytecodeOpCode {
    NOP = 0x00,
    END = 0x01,
    WAIT = 0x02,
    WAIT_FOR_BUTTON = 0x03,  // Choose an appropriate unused value
    CHECK_RIGHT_BUTTON_PRESS = 0x04,
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

    MOTOR_DRIVE = 0x50,        // Drive forward/backward at specified throttle
    MOTOR_STOP = 0x52,      // Stop all motors
    MOTOR_TURN = 0x53,      // Turn by specified degrees
    MOTOR_DRIVE_TIME = 0x54,   // Drive forward/backward for specified time
    MOTOR_DRIVE_DISTANCE = 0x56, // Drive forward/backward for specified distance
    MOTOR_SPIN = 0x57,        // Spin motors in opposite directions

    PLAY_SOUND = 0x60,
    PLAY_TONE = 0x61,
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
    MAG_FIELD_Z = 12,
    SIDE_LEFT_PROXIMITY = 13,
    SIDE_RIGHT_PROXIMITY = 14,
    FRONT_PROXIMITY = 15,
    SENSOR_COLOR_RED = 16,
    SENSOR_COLOR_GREEN = 17,
    SENSOR_COLOR_BLUE = 18,
    SENSOR_COLOR_WHITE = 19,
    SENSOR_COLOR_BLACK = 20,
    SENSOR_COLOR_YELLOW = 21,
    FRONT_TOF_DISTANCE = 22,
}

export enum CommandType {
    SET_LED_COLOR = "SET_LED_COLOR",
    PLAY_SOUND = "PLAY_SOUND",
    PLAY_TONE = "PLAY_TONE",
    WAIT = "WAIT",

    VARIABLE_ASSIGNMENT = "VARIABLE_ASSIGNMENT",

    IF_STATEMENT = "IF_STATEMENT",
    COMPOUND_AND_IF_STATEMENT = "COMPOUND_AND_IF_STATEMENT",
    COMPOUND_OR_IF_STATEMENT = "COMPOUND_OR_IF_STATEMENT",
    ELSE_IF_STATEMENT = "ELSE_IF_STATEMENT",
    COMPOUND_AND_ELSE_IF_STATEMENT = "COMPOUND_AND_ELSE_IF_STATEMENT",
    COMPOUND_OR_ELSE_IF_STATEMENT = "COMPOUND_OR_ELSE_IF_STATEMENT",
    ELSE_STATEMENT = "ELSE_STATEMENT",
    BLOCK_START = "BLOCK_START",
    BLOCK_END = "BLOCK_END",
    WHILE_STATEMENT = "WHILE_STATEMENT",
    FOR_STATEMENT = "FOR_STATEMENT",
    IMU_READ = "IMU_READ",

    DRIVE = "DRIVE",
    DRIVE_TIME = "DRIVE_TIME",
    DRIVE_DISTANCE = "DRIVE_DISTANCE",
    MOTOR_STOP = "MOTOR_STOP",
    MOTOR_TURN = "MOTOR_TURN",
    MOTOR_SPIN = "MOTOR_SPIN",

    LEFT_DISTANCE_SENSOR = "LEFT_DISTANCE_SENSOR",
    RIGHT_DISTANCE_SENSOR = "RIGHT_DISTANCE_SENSOR",
    FRONT_PROXIMITY_DETECTION = "FRONT_PROXIMITY_DETECTION",
    WAIT_FOR_BUTTON = "WAIT_FOR_BUTTON",
    COLOR_SENSOR_READ = "COLOR_SENSOR_READ",
    CHECK_IF_RIGHT_BUTTON_PRESSED = "CHECK_IF_RIGHT_BUTTON_PRESSED",
    GET_FRONT_TOF_DISTANCE = "GET_FRONT_TOF_DISTANCE",
}

// Common regex patterns
export const comparisonOperatorPattern = /(.+?)([<>=!][=]?)(.+)/

// Command patterns for validation
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CommandPatterns: Record<CommandType, RegExp> = {
	[CommandType.SET_LED_COLOR]: /^all_leds\.set_color\(\s*(OFF|RED|GREEN|BLUE|WHITE|PURPLE|YELLOW)\s*\)$/,
	[CommandType.PLAY_SOUND]: /^speaker\.play_sound\(\s*"([^"]*)"\s*\)$/,
	[CommandType.PLAY_TONE]: /^speaker\.play_tone\(\s*"([^"]*)"\s*\)$/,
	[CommandType.WAIT]: /^wait\(\s*(\d+(?:\.\d+)?)\s*\)$/,

	[CommandType.VARIABLE_ASSIGNMENT]: /^(float|int|bool)\s+(\w+)\s*=\s*(.+)$/,

	// Updated regex for IF_STATEMENT
	[CommandType.IF_STATEMENT]: /^if\s*\(\s*(?:left_distance_sensor\.is_object_near\(\)|right_distance_sensor\.is_object_near\(\)|front_distance_sensor\.is_object_in_front\(\)|right_button\.is_pressed\(\)|color_sensor\.is_object\(\s*(RED|GREEN|BLUE|WHITE|BLACK|YELLOW)\s*\)|(true|false)|\b(\w+)\b|(imu\.\w+\(\)|front_distance_sensor\.get_distance\(\)|[-\d.]+|\w+)\s*([<>=!][=]?)\s*(imu\.\w+\(\)|front_distance_sensor\.get_distance\(\)|[-\d.]+|\w+))\s*\)$/,
	[CommandType.COMPOUND_OR_IF_STATEMENT]: /^if\s*\(\s*\(.+?\)\s*\|\|\s*\(.+?\)\s*\)$/,
	[CommandType.ELSE_IF_STATEMENT]: /^else\s+if\s*\(\s*(?:left_distance_sensor\.is_object_near\(\)|right_distance_sensor\.is_object_near\(\)|front_distance_sensor\.is_object_in_front\(\)|right_button\.is_pressed\(\)|color_sensor\.is_object\(\s*(RED|GREEN|BLUE|WHITE|BLACK|YELLOW)\s*\)|(true|false)|\b(\w+)\b|(imu\.\w+\(\)|front_distance_sensor\.get_distance\(\)|[-\d.]+|\w+)\s*([<>=!][=]?)\s*(imu\.\w+\(\)|front_distance_sensor\.get_distance\(\)|[-\d.]+|\w+))\s*\)$/,
	[CommandType.COMPOUND_AND_IF_STATEMENT]: /^if\s*\(\s*\(.+?\)\s*&&\s*\(.+?\)\s*\)$/,
	[CommandType.COMPOUND_AND_ELSE_IF_STATEMENT]: /^else\s+if\s*\(\s*\(.+?\)\s*&&\s*\(.+?\)\s*\)$/,
	[CommandType.COMPOUND_OR_ELSE_IF_STATEMENT]: /^else\s+if\s*\(\s*\(.+?\)\s*\|\|\s*\(.+?\)\s*\)$/,
	[CommandType.ELSE_STATEMENT]: /^else$/,
	[CommandType.BLOCK_START]: /^{$/,
	[CommandType.BLOCK_END]: /^}$/,
	[CommandType.WHILE_STATEMENT]: /^while\s*\(\s*true\s*\)$/,
	[CommandType.FOR_STATEMENT]: /^for\s*\(\s*int\s+(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)\s*;\s*\1\s*\+\+\s*\)$/,
	[CommandType.IMU_READ]: /^imu\.(\w+)\(\)$/,

	[CommandType.DRIVE]: /^motors.drive\(\s*(FORWARD|BACKWARD)\s*,\s*(\d+)\s*\)$/,
	[CommandType.DRIVE_TIME]: /^motors.drive_time\(\s*(FORWARD|BACKWARD)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+)\s*\)$/,
	[CommandType.DRIVE_DISTANCE]: /^motors.drive_distance\(\s*(FORWARD|BACKWARD)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+)\s*\)$/,
	[CommandType.MOTOR_STOP]: /^motors.stop\(\)$/,
	[CommandType.MOTOR_TURN]: /^motors.turn\(\s*(CLOCKWISE|COUNTERCLOCKWISE)\s*,\s*(\d+)\s*\)$/,
	[CommandType.MOTOR_SPIN]: /^motors.spin\(\s*(CLOCKWISE|COUNTERCLOCKWISE)\s*,\s*(\d+)\s*\)$/,

	[CommandType.WAIT_FOR_BUTTON]: /^left_button.wait_for_press\(\)$/,
	[CommandType.CHECK_IF_RIGHT_BUTTON_PRESSED]: /^right_button.is_pressed\(\)$/,
	[CommandType.LEFT_DISTANCE_SENSOR]: /^left_distance_sensor\.is_object_near\(\)$/,
	[CommandType.RIGHT_DISTANCE_SENSOR]: /^right_distance_sensor\.is_object_near\(\)$/,
	[CommandType.GET_FRONT_TOF_DISTANCE]: /^front_distance_sensor.get_distance\(\)$/,
	[CommandType.FRONT_PROXIMITY_DETECTION]: /^front_distance_sensor.is_object_in_front\(\)$/,
	[CommandType.COLOR_SENSOR_READ]: /^color_sensor\.is_object\(\s*(RED|GREEN|BLUE|WHITE|BLACK|YELLOW)\s*\)$/,
}
