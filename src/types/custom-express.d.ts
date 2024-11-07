declare global {
	namespace Express {
		interface Request {
			user: ExtendedCredentials
			pipUUIDData: ExtendedPipUUID
		}
	}
}

export {}
