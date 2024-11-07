import SecretsManager from "../classes/secrets-manager"

export default async function generatePipUUID(): Promise<PipUUID> {
	try {
		const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
		let result = ""
		for (let i = 0; i < 5; i++) {
			const randomIndex = Math.floor(Math.random() * characters.length)
			result += characters[randomIndex]
		}
		const hardwareVersion = await SecretsManager.getInstance().getSecret("PIP_HARDWARE_VERSION")
		return `${result}-${hardwareVersion}` as PipUUID
	} catch (error) {
		console.error(error)
		throw error
	}
}
