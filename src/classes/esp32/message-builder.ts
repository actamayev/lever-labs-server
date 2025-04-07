import { BalanceStatus, LightType, MessageType, SoundType, SpeakerStatus } from "../../utils/protocol"

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

	static createLightMessage(lightMessageType: LightType): ArrayBuffer {
		const buffer = new ArrayBuffer(2)
		const view = new DataView(buffer)

		view.setUint8(0, MessageType.UPDATE_LIGHT_ANIMATION)
		view.setUint8(1, lightMessageType)

		return buffer
	}

	static createLedMessage(data: Omit<IncomingNewLedControlData, "pipUUID">): ArrayBuffer {
		// Calculate buffer size: 1 byte for message type + 6 RGB colors × 3 components × 1 byte per uint8
		const buffer = new ArrayBuffer(1 + 6 * 3 * 1) // 19 bytes total
		const view = new DataView(buffer)

		// Set message type
		view.setUint8(0, MessageType.UPDATE_LED_COLORS)

		// Top Left Color
		view.setUint8(1, data.topLeftColor.red)
		view.setUint8(2, data.topLeftColor.green)
		view.setUint8(3, data.topLeftColor.blue)

		// Top Right Color
		view.setUint8(4, data.topRightColor.red)
		view.setUint8(5, data.topRightColor.green)
		view.setUint8(6, data.topRightColor.blue)

		// Middle Left Color
		view.setUint8(7, data.middleLeftColor.red)
		view.setUint8(8, data.middleLeftColor.green)
		view.setUint8(9, data.middleLeftColor.blue)

		// Middle Right Color
		view.setUint8(10, data.middleRightColor.red)
		view.setUint8(11, data.middleRightColor.green)
		view.setUint8(12, data.middleRightColor.blue)

		// Back Left Color
		view.setUint8(13, data.backLeftColor.red)
		view.setUint8(14, data.backLeftColor.green)
		view.setUint8(15, data.backLeftColor.blue)

		// Back Right Color
		view.setUint8(16, data.backRightColor.red)
		view.setUint8(17, data.backRightColor.green)
		view.setUint8(18, data.backRightColor.blue)

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
		const buffer = new ArrayBuffer(41) // 1 byte for type + 10 float values * 4 bytes each = 41 bytes
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
		view.setFloat32(37, props.minEffectivePwm, true) // float value

		return buffer
	}
}
