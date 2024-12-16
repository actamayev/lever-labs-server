
import _ from "lodash"
import axios from "axios"
import Singleton from "../singleton"
import SecretsManager from "./secrets-manager"
import sanitizeUserCode from "../../utils/cpp/sanitize-user-code"

export default class ECSManager extends Singleton {
	private compilerEndpoint!: string

	private constructor() {
		super()
		void this.assignCompilerEndpoint()
	}

	public static getInstance(): ECSManager {
		if (_.isNull(ECSManager.instance)) {
			ECSManager.instance = new ECSManager()
		}
		return ECSManager.instance
	}

	private async assignCompilerEndpoint(): Promise<void> {
		try {
			const secretsManagerInstance = SecretsManager.getInstance()
			this.compilerEndpoint = await secretsManagerInstance.getSecret("COMPILER_ENDPOINT")
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	public async compileCode(userCode: string, pipUUID: PipUUID): Promise<Buffer> {
		try {
			// Make HTTP request to compiler service
			const response = await axios.post(`${this.compilerEndpoint}/compile`, {
				userCode: sanitizeUserCode(userCode),
				pipUUID
			}, {
				responseType: "arraybuffer",  // Important for receiving binary data
				timeout: 30000  // 30 second timeout
			})

			return Buffer.from(response.data)
		} catch (error) {
			console.error("Compilation error:", error)
			throw error
		}
	}
}
