import _ from "lodash"
import Singleton from "./singleton"
import ECSManager from "./aws/ecs-manager"
import LocalCompilationManager from "./local-compilation-manager"

export default class CompilerContainerManager extends Singleton {
	private environment: CompilerEnvironment
	private ecsManagerInstance?: ECSManager
	private localCompilationManagerInstance?: LocalCompilationManager

	private constructor() {
		super()
		this.environment = process.env.NODE_ENV

		if (_.isUndefined(this.environment)) { // Means localdev
			this.localCompilationManagerInstance = LocalCompilationManager.getInstance()
		} else {
			this.ecsManagerInstance = ECSManager.getInstance()
		}
	}

	public static getInstance(): CompilerContainerManager {
		if (!CompilerContainerManager.instance) {
			CompilerContainerManager.instance = new CompilerContainerManager()
		}
		return CompilerContainerManager.instance
	}

	public async compile(userCode: string, pipUUID: PipUUID): Promise<Buffer> {
		try {
			if (_.isUndefined(this.environment)) {
				if (_.isUndefined(this.localCompilationManagerInstance)) {
					throw Error("Can't find localCompilationManagerInstance")
				}
				return await this.localCompilationManagerInstance.compileLocal(userCode, pipUUID)
			} else {
				if (_.isUndefined(this.ecsManagerInstance)) {
					throw Error("Can't find ecsManagerInstance")
				}
				return this.ecsManagerInstance.compileCode(userCode, pipUUID)
			}
		} catch (error) {
			console.error(error)
			throw error
		}
	}
}
