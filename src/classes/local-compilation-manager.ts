import axios from "axios"
import isNull from "lodash-es/isNull"
import Singleton from "./singleton"
import sanitizeUserCode from "../utils/cpp/sanitize-user-code"

export default class LocalCompilationManager extends Singleton {
	private readonly compilerEndpoint: string = "http://localhost:3001"

	private constructor() {
		super()
	}

	public static getInstance(): LocalCompilationManager {
		if (isNull(LocalCompilationManager.instance)) {
			LocalCompilationManager.instance = new LocalCompilationManager()
		}
		return LocalCompilationManager.instance
	}

	public async compileLocal(userCode: string, pipUUID: PipUUID): Promise<Buffer> {
		try {
			const response = await axios.post(`${this.compilerEndpoint}/compile`, {
				userCode: sanitizeUserCode(userCode),
				pipUUID
			}, {
				responseType: "arraybuffer",
				timeout: 30000  // 30 second timeout
			})

			return Buffer.from(response.data)
		} catch (error) {
			console.error("Compilation error:", error)
			throw error
		}
	}
}
