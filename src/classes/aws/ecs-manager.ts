
import _ from "lodash"
import axios from "axios"
import Singleton from "../singleton"
import sanitizeUserCode from "../../utils/cpp/sanitize-user-code"

export default class ECSManager extends Singleton {
	private compilerEndpoint: string

	private constructor() {
		super()
		this.compilerEndpoint = process.env.NODE_ENV === "production"
			? "http://production-compiler.ec2.internal:3001"
			: "http://ip-172-31-94-240.ec2.internal:3001"
	}

	public static getInstance(): ECSManager {
		if (_.isNull(ECSManager.instance)) {
			ECSManager.instance = new ECSManager()
		}
		return ECSManager.instance
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
