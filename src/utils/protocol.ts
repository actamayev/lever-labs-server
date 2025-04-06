export enum MessageType {
    FIRMWARE_CHUNK = 0,
    MOTOR_CONTROL = 1,
    SOUND_COMMAND = 2,
    SPEAKER_MUTE = 3,
    BALANCE_CONTROL = 4,
    UPDATE_BALANCE_PIDS = 5,
    UPDATE_LIGHTS = 6
}

export enum SoundType {
    ALERT = 0,
    BEEP = 1,
    CHIME = 2
}

export enum LightType {
    BREATHING = 0,
    TURN_OFF = 1,
    FADE_OUT = 2,
    PAUSE_BREATHING = 3
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

export const lightToLEDType: Record<LightStatus, LightType> = {
	"Breathing": LightType.BREATHING,
	"Turn off": LightType.TURN_OFF,
	"Fade out": LightType.FADE_OUT,
	"Pause breathing": LightType.PAUSE_BREATHING,
}
