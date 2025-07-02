declare global {
	namespace Express {
		interface Request {
			user: ExtendedCredentials
			pipUUIDData: ExtendedPipUUID
			userId: number
			activityId: number
			readingBlockId: number
			sandboxProjectId: number
			bytecode: Float32Array
		}
	}
}

export {}
