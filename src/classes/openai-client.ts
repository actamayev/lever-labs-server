import OpenAI from "openai"
import isUndefined from "lodash/isUndefined"
import SecretsManager from "./aws/secrets-manager"

export default class OpenAiClientClass {
	private static openAiClient?: OpenAI

	private constructor() {
	}

	public static async getOpenAiClient(): Promise<OpenAI> {
		try {
			if (isUndefined(this.openAiClient)) {
				const { OPENROUTER_API_KEY, SITE_URL, SITE_NAME } = await SecretsManager.getInstance().getSecrets(
					["OPENROUTER_API_KEY", "SITE_URL", "SITE_NAME"]
				)
				this.openAiClient = new OpenAI({
					baseURL: "https://openrouter.ai/api/v1",
					apiKey: OPENROUTER_API_KEY,
					defaultHeaders: {
						"HTTP-Referer": SITE_URL,
						"X-Title": SITE_NAME,
					},
				})
			}
			return this.openAiClient
		} catch (error) {
			console.error(error)
			throw error
		}
	}
}
