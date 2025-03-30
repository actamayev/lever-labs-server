import { MessageType, SoundType, SpeakerStatus } from "../../utils/protocol"

export class MessageBuilder {
	// Create motor control message
	static createMotorControlMessage(leftMotor: number, rightMotor: number): ArrayBuffer {
		const buffer = new ArrayBuffer(5)
		const view = new DataView(buffer)

		view.setUint8(0, MessageType.MOTOR_CONTROL)
		view.setInt16(1, leftMotor, true)  // Little endian
		view.setInt16(3, rightMotor, true) // Little endian

		return buffer
	}

	// Create sound command message
	static createSoundMessage(soundType: SoundType): ArrayBuffer {
		const buffer = new ArrayBuffer(2)
		const view = new DataView(buffer)

		view.setUint8(0, MessageType.SOUND_COMMAND)
		view.setUint8(1, soundType)

		return buffer
	}

	// Create speaker mute message
	static createSpeakerMuteMessage(audibleStatus: boolean): ArrayBuffer {
		const buffer = new ArrayBuffer(2)
		const view = new DataView(buffer)

		view.setUint8(0, MessageType.SPEAKER_MUTE)
		view.setUint8(1, audibleStatus ? SpeakerStatus.MUTED : SpeakerStatus.UNMUTED)

		return buffer
	}
}
