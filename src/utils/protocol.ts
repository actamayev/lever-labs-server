export enum MessageType {
    FIRMWARE_CHUNK = 0,
    MOTOR_CONTROL = 1,
    SOUND_COMMAND = 2,
    SPEAKER_MUTE = 3,
    BALANCE_CONTROL = 4
}

export enum SoundType {
    ALERT = 0,
    BEEP = 1,
    CHIME = 2
}

export enum SpeakerStatus {
    UNMUTED = 0,
    MUTED = 1
}

export enum BalanceStatus {
    UNBALANCED = 0,
    BALANCED = 1
}

export type TuneToPlay = "Alert" | "Beep" | "Chime";

// Mapping between string enum and numeric enum
export const tuneToSoundType: Record<TuneToPlay, SoundType> = {
	"Alert": SoundType.ALERT,
	"Beep": SoundType.BEEP,
	"Chime": SoundType.CHIME
}
