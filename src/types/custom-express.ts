declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			user: ExtendedCredentials
			pipUUIDData: ExtendedPipUUID
			userId: number
			activityId: number
			readingBlockId: number
			sandboxProjectId: number
			bytecode: Float32Array

			teacherId: number
			classroomId: number
			studentUserId: number
			studentId: number
		}
	}
}

export {}
