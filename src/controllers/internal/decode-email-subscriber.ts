import { Response, Request } from "express"
import Encryptor from "../../classes/encryptor"
import { ErrorResponse } from "@actamayev/lever-labs-common-ts/types/api"

export default async function decodeEmailSubscriber (req: Request, res: Response): Promise<void> {
	try {
		const { email } = req.body

		const encryptor = new Encryptor()
		const decryptedEmail = await encryptor.deterministicDecrypt(email, "EMAIL_ENCRYPTION_KEY")

		res.status(200).json({ decryptedEmail })
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to decrypt email" } satisfies ErrorResponse)
		return
	}
}
