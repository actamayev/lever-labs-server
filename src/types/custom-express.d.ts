import { pip_uuid } from "@prisma/client"

declare global {
	namespace Express {
		interface Request {
			user: ExtendedCredentials
			pipUUIDData: pip_uuid
		}
	}
}

export {}
