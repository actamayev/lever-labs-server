import OpenAI from "openai"
import isUndefined from "lodash/isUndefined"
import SecretsManager from "./aws/secrets-manager"
import { SITE_NAME, SITE_URL } from "../utils/constants"

export default class OpenAiClientClass {
	private static openAiClient?: OpenAI

	private constructor() {
	}

	public static async getOpenAiClient(): Promise<OpenAI> {
		try {
			if (isUndefined(this.openAiClient)) {
				const openRouterApiKey = await SecretsManager.getInstance().getSecret("OPENROUTER_API_KEY")
				this.openAiClient = new OpenAI({
					baseURL: "https://openrouter.ai/api/v1",
					apiKey: openRouterApiKey,
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
