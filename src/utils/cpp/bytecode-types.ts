/* eslint-disable @typescript-eslint/naming-convention */
// bytecode_types.ts
export enum BytecodeOpCode {
	NOP = 0x00,
	END = 0x01,
	DELAY = 0x02,
	SET_LED = 0x10,
	SET_ALL_LEDS = 0x11
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
	DELAY = "DELAY"
}

export interface BytecodeInstruction {
	opcode: BytecodeOpCode
	operand1: number
	operand2: number
	operand3: number
	operand4: number
}

export const MAX_LED_BRIGHTNESS = 255

// Command patterns for validation
export const CommandPatterns: Record<CommandType, RegExp> = {
	[CommandType.TURN_LED_OFF]: /^RgbLed::turn_led_off\(\)$/,
	[CommandType.SET_LED_RED]: /^RgbLed::set_led_red\(\)$/,
	[CommandType.SET_LED_GREEN]: /^RgbLed::set_led_green\(\)$/,
	[CommandType.SET_LED_BLUE]: /^RgbLed::set_led_blue\(\)$/,
	[CommandType.SET_LED_WHITE]: /^RgbLed::set_led_white\(\)$/,
	[CommandType.SET_LED_PURPLE]: /^RgbLed::set_led_purple\(\)$/,
	[CommandType.SET_ALL_LEDS]: /^set_all_leds_to_color\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
	[CommandType.SET_TOP_LEFT_LED]: /^rgbLed\.set_top_left_led\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
	[CommandType.SET_TOP_RIGHT_LED]: /^rgbLed\.set_top_right_led\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
	[CommandType.SET_MIDDLE_LEFT_LED]: /^rgbLed\.set_middle_left_led\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
	[CommandType.SET_MIDDLE_RIGHT_LED]: /^rgbLed\.set_middle_right_led\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
	[CommandType.SET_BACK_LEFT_LED]: /^rgbLed\.set_back_left_led\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
	[CommandType.SET_BACK_RIGHT_LED]: /^rgbLed\.set_back_right_led\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
	[CommandType.DELAY]: /^delay\(\s*(\d+)\s*\)$/
}
