import { createCipheriv, createDecipheriv } from "crypto"
import SecretsManager from "./aws/secrets-manager"

export default class Encryptor {
	constructor() {
	}

	public async deterministicEncrypt(data: string, encryptionKeyName: DeterministicEncryptionKeys): Promise<DeterministicEncryptedString> {
		try {
			const iv = Buffer.alloc(16, 0) // Fixed IV (not recommended for production)
			const encryptionKey = await SecretsManager.getInstance().getSecret(encryptionKeyName)

			const cipher = createCipheriv("aes-256-cbc", Buffer.from(encryptionKey, "base64"), iv)
			let encrypted = cipher.update(data, "utf8", "base64")
			encrypted += cipher.final("base64")
			return encrypted as DeterministicEncryptedString
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	public async deterministicDecrypt(
		encrypted: DeterministicEncryptedString,
		encryptionKeyName: DeterministicEncryptionKeys
	): Promise<string> {
		try {
			const iv = Buffer.alloc(16, 0) // Fixed IV (not recommended for production)
			const encryptionKey = await SecretsManager.getInstance().getSecret(encryptionKeyName)

			const decipher = createDecipheriv("aes-256-cbc", Buffer.from(encryptionKey, "base64"), iv)
			let decrypted = decipher.update(encrypted, "base64", "utf8")
			decrypted += decipher.final("utf8")
			return decrypted
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	public static isDeterministicEncryptedString(data: string): data is DeterministicEncryptedString {
		try {
		// Check if the data is a valid Base64 string
		// Base64 regex pattern: ^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$
		// eslint-disable-next-line security/detect-unsafe-regex, no-useless-escape
			const regex = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/
			return regex.test(data)
		} catch (error) {
			console.error(error)
			throw error
		}
	}
}
