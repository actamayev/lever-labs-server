import CompilerContainerManager from "../../classes/compiler-container-manager"

export default async function compileUserCode(userCode: string): Promise<Buffer> {
	try {
		const compiler = CompilerContainerManager.getInstance()
		return await compiler.compile(userCode)
	} catch (error) {
		if (error instanceof Error) {
			console.error("Error compiling code:", error.message)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const execError = error as any
			if (execError.stdout) console.info("stdout:", execError.stdout.toString())
			if (execError.stderr) console.info("stderr:", execError.stderr.toString())
		}
		throw error
	}
}
