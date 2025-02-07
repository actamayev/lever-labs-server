import isUndefined from "lodash/isUndefined"
import { PrismaClient } from "@prisma/client"
import SecretsManager from "./aws/secrets-manager"

export default class PrismaClientClass {
	private static prismaClient?: PrismaClient

	private constructor() {
	}

	public static async getPrismaClient(): Promise<PrismaClient> {
		try {
			if (isUndefined(this.prismaClient)) {
				const databaseUrl = await SecretsManager.getInstance().getSecret("DATABASE_URL")
				this.prismaClient = new PrismaClient({
					datasources: {
						db: {
							url: databaseUrl
						}
					}
				})
			}
			return this.prismaClient
		} catch (error) {
			console.error(error)
			throw error
		}
	}
}
