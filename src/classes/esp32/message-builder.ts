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

	static createUpdateBalancePidsMessage(props: Omit<BalancePidsProps, "pipUUID">): ArrayBuffer {
		const buffer = new ArrayBuffer(37) // 1 byte for type + 9 float values * 4 bytes each = 37 bytes
		const view = new DataView(buffer)

		view.setUint8(0, MessageType.UPDATE_BALANCE_PIDS) // Message type
		view.setFloat32(1, props.pValue, true)          // float value
		view.setFloat32(5, props.iValue, true)          // float value
		view.setFloat32(9, props.dValue, true)          // float value
		view.setFloat32(13, props.ffValue, true)        // float value
		view.setFloat32(17, props.targetAngle, true)    // float value
		view.setFloat32(21, props.maxSafeAngleDeviation, true) // float value
		view.setFloat32(25, props.updateInterval, true) // float value
		view.setFloat32(29, props.deadbandAngle, true)  // float value
		view.setFloat32(33, props.maxStableRotation, true) // float value

		return buffer
	}
}
