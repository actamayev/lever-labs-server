import { BalanceStatus, LightAnimationType, MessageType, SoundType, SpeakerStatus } from "../../utils/protocol"

export class MessageBuilder {
	static createUpdateAvailableMessage(newFirmwareVersion: number): ArrayBuffer {
		const buffer = new ArrayBuffer(3)
		const view = new DataView(buffer)

		view.setUint8(0, MessageType.UPDATE_AVAILABLE)
		view.setUint16(1, newFirmwareVersion, true) // true for little-endian

		return buffer
	  }

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

	static createLightAnimationMessage(lightMessageType: LightAnimationType): ArrayBuffer {
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
		view.setUint8(1, data.topLeftColor.r)
		view.setUint8(2, data.topLeftColor.g)
		view.setUint8(3, data.topLeftColor.b)

		// Top Right Color
		view.setUint8(4, data.topRightColor.r)
		view.setUint8(5, data.topRightColor.g)
		view.setUint8(6, data.topRightColor.b)

		// Middle Left Color
		view.setUint8(7, data.middleLeftColor.r)
		view.setUint8(8, data.middleLeftColor.g)
		view.setUint8(9, data.middleLeftColor.b)

		// Middle Right Color
		view.setUint8(10, data.middleRightColor.r)
		view.setUint8(11, data.middleRightColor.g)
		view.setUint8(12, data.middleRightColor.b)

		// Back Left Color
		view.setUint8(13, data.backLeftColor.r)
		view.setUint8(14, data.backLeftColor.g)
		view.setUint8(15, data.backLeftColor.b)

		// Back Right Color
		view.setUint8(16, data.backRightColor.r)
		view.setUint8(17, data.backRightColor.g)
		view.setUint8(18, data.backRightColor.b)

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

	static createBytecodeMessage(bytecodeFloat32: Float32Array): ArrayBuffer {
		// Get the raw bytes from the Float32Array
		const bytecodeBytes = new Uint8Array(bytecodeFloat32.buffer)

		// Create buffer: 1 byte for message type + bytecode bytes length
		const buffer = new ArrayBuffer(1 + bytecodeBytes.length)
		const view = new DataView(buffer)

		// Set message type
		view.setUint8(0, MessageType.BYTECODE_PROGRAM)

		// Copy bytecode bytes into buffer starting at offset 1
		const bytecodeView = new Uint8Array(buffer, 1)
		bytecodeView.set(bytecodeBytes)

		return buffer
	}
}
