export enum MessageType {
    FIRMWARE_CHUNK = 0,
    MOTOR_CONTROL = 1,
    SOUND_COMMAND = 2,
    SPEAKER_MUTE = 3,
    BALANCE_CONTROL = 4,
    UPDATE_BALANCE_PIDS = 5,
    UPDATE_LIGHT_ANIMATION = 6,
    UPDATE_LED_COLORS = 7
}

export enum SoundType {
    ALERT = 0,
    BEEP = 1,
    CHIME = 2
}

export enum LightAnimationType {
    NO_ANIMATION = 0,
    BREATHING = 1,
    RAINBOW = 2,
    STROBE = 3,
    TURN_OFF = 4,
    FADE_OUT = 5,
    PAUSE_BREATHING = 6,
    // SNAKE = 7
}

export enum SpeakerStatus {
    UNMUTED = 0,
    MUTED = 1
}

export enum BalanceStatus {
    UNBALANCED = 0,
    BALANCED = 1
}

// Mapping between string enum and numeric enum
export const tuneToSoundType: Record<TuneToPlay, SoundType> = {
	"Alert": SoundType.ALERT,
	"Beep": SoundType.BEEP,
	"Chime": SoundType.CHIME
}

export const lightToLEDType: Record<LightAnimation, LightAnimationType> = {
	"No animation": LightAnimationType.NO_ANIMATION,
	"Breathing": LightAnimationType.BREATHING,
	"Rainbow": LightAnimationType.RAINBOW,
	"Strobe": LightAnimationType.STROBE,
	"Turn off": LightAnimationType.TURN_OFF,
	"Fade out": LightAnimationType.FADE_OUT,
	"Pause breathing": LightAnimationType.PAUSE_BREATHING,
	// "Snake": LightAnimationType.SNAKE,
}
