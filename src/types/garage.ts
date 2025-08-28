declare global {
	type SerializedBuffer = {
		[key: number]: number
	} & {
		length?: number
	}

	type BufferLike = Buffer | SerializedBuffer
}

export {}
