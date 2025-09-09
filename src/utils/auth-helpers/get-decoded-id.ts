import jwt from "jsonwebtoken"
import { JwtPayload } from "@bluedotrobots/common-ts/types/auth"
import SecretsManager from "../../classes/aws/secrets-manager"

export default async function getDecodedId(accessToken: string): Promise<number> {
	try {
		const jwtKey = await SecretsManager.getInstance().getSecret("JWT_KEY")
		const decoded = jwt.verify(accessToken, jwtKey) as JwtPayload
		return decoded.userId
	} catch (error) {
		console.error(error)
		throw error
	}
}
