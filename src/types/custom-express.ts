declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			user: ExtendedCredentials
			userId: number
			readingBlockId: number
			sandboxProjectId: number
			bytecode: Float32Array

			teacherId: number
			classroomId: number
			studentId: number
			challengeId: number
			careerId: number
		}
	}
}

export {}
