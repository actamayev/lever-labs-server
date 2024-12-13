import _ from "lodash"
import dotenv from "dotenv"
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"
import Singleton from "../singleton"

export default class SecretsManager extends Singleton {
	private secrets: Map<SecretKeys, string> = new Map()
	private secretsManager?: SecretsManagerClient

	private constructor() {
		super()
		if (process.env.NODE_ENV !== "staging" && process.env.NODE_ENV !== "production") {
			dotenv.config({ path: ".env.local" })
			return
		}
		this.secretsManager = new SecretsManagerClient({
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			},

			region: this.region
		})
	}

	public static getInstance(): SecretsManager {
		if (_.isNull(SecretsManager.instance)) {
			SecretsManager.instance = new SecretsManager()
		}
		return SecretsManager.instance
	}

	public async getSecret(key: SecretKeys): Promise<string> {
		try {
			let secret: string | undefined
			if (this.secrets.has(key)) {
				secret = this.secrets.get(key)
			}
			else if (process.env.NODE_ENV !== "staging" && process.env.NODE_ENV !== "production") {
				secret = process.env[key]
			}
			else {
				secret = await this.fetchSecretFromAWS(key)
			}
			if (_.isUndefined(secret)) throw Error("Unable to retrieve secret")
			return secret
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	public async getSecrets(keys: SecretKeys[]): Promise<SecretsObject> {
		try {
			const secrets: Partial<SecretsObject> = {}

			if (process.env.NODE_ENV !== "staging" && process.env.NODE_ENV !== "production") {
				for (const key of keys) {
					const secret = process.env[key]
					secrets[key] = secret
				}
			} else {
				const missingKeys = keys.filter(key => !this.secrets.has(key))
				if (!_.isEmpty(missingKeys)) await this.fetchAllSecretsFromAWS()
				for (const key of keys) {
					const secret = this.secrets.get(key)
					// eslint-disable-next-line max-depth
					if (_.isUndefined(secret)) {
						throw new Error(`Unable to retrieve secret for key: ${key}`)
					}
					secrets[key] = secret
				}
			}
			return secrets as SecretsObject
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	private async fetchSecretFromAWS(key: SecretKeys): Promise<string> {
		try {
			await this.fetchAllSecretsFromAWS()
			const secretValue = this.secrets.get(key)
			if (_.isUndefined(secretValue)) {
				throw new Error(`Secret value for key ${key} is undefined!`)
			}
			return secretValue
		} catch (error) {
			console.error("Error retrieving secret from AWS:", error)
			throw error
		}
	}

	private async fetchAllSecretsFromAWS(): Promise<void> {
		try {
			const command = new GetSecretValueCommand({
				SecretId: this.getSecretName()
			})

			if (_.isUndefined(this.secretsManager)) {
				throw new Error("Secrets Manager client is not initialized!")
			}
			const response = await this.secretsManager.send(command)

			if (_.isUndefined(response.SecretString)) {
				throw new Error("SecretString is undefined!")
			}

			this.updateSecretsMap(response.SecretString)
		} catch (error) {
			console.error("Error retrieving secrets from AWS:", error)
			throw error
		}
	}

	private updateSecretsMap(secretsString: string): void {
		try {
			const secrets = JSON.parse(secretsString)
			Object.keys(secrets).forEach(key => {
				const secretKey = key as SecretKeys
				const value = secrets[key]
				if (!_.isUndefined(value)) {
					this.secrets.set(secretKey, value)
				} else {
					console.error(`Value for key ${key} is undefined.`)
				}
			})
		}
		catch (error) {
			console.error(error)
			throw error
		}
	}

	private getSecretName(): string {
		if (process.env.NODE_ENV === "staging") {
			return "blue-dot-staging-secrets"
		} else if (process.env.NODE_ENV === "production") {
			return "blue-dot-production-secrets"
		}
		return ""
	}
}
