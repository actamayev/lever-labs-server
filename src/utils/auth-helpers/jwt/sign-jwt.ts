import jwt from "jsonwebtoken"
import { JwtPayload } from "@actamayev/lever-labs-common-ts/types/auth"
import SecretsManager from "../../../classes/aws/secrets-manager"

export default async function signJWT(payload: JwtPayload): Promise<string> {
	try {
		const jwtKey = await SecretsManager.getInstance().getSecret("JWT_KEY")

		return jwt.sign(payload, jwtKey)
	} catch (error) {
		console.error(error)
		throw error
	}
}
