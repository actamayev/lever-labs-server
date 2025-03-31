import { BalanceStatus, MessageType, SoundType, SpeakerStatus } from "../../utils/protocol"

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

	static createBalanceMessage(balanceStatus: boolean): ArrayBuffer {
		const buffer = new ArrayBuffer(2)
		const view = new DataView(buffer)

		view.setUint8(0, MessageType.BALANCE_CONTROL)
		view.setUint8(1, balanceStatus ? BalanceStatus.BALANCED : BalanceStatus.UNBALANCED)

		return buffer
	}

	static createUpdateBalancePidsMessage(props: BalancePidsProps): ArrayBuffer {
		const buffer = new ArrayBuffer(10) // 1 byte for type + 9 bytes for values
		const view = new DataView(buffer)

		view.setUint8(0, MessageType.UPDATE_BALANCE_PIDS) // Message type
		view.setUint8(1, props.pValue)          // 0-255 range
		view.setUint8(2, props.iValue)          // 0-255 range
		view.setUint8(3, props.dValue)          // 0-255 range
		view.setUint8(4, props.ffValue)         // 0-255 range
		view.setUint8(5, props.targetAngle)     // 0-255 range
		view.setUint8(6, props.maxSafeAngleDeviation) // 0-255 range
		view.setUint8(7, props.updateInterval)  // 0-255 range
		view.setUint8(8, props.deadbandAngle)   // 0-255 range
		view.setUint8(9, props.maxStableRotation) // 0-255 range

		return buffer
	}
}
