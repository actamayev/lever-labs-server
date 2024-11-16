import CompilerContainerManager from "../../classes/compiler-container-manager"

// eslint-disable-next-line max-lines-per-function, complexity
export default async function compileUserCode(userCode: string): Promise<Buffer> {
	try {
		const compiler = CompilerContainerManager.getInstance()
		const binary = await compiler.compile(userCode)

		if (!binary || binary.length === 0) {
			throw new Error("No binary data received from compilation")
		}

		// Enhanced verification
		console.log(`Binary size: ${binary.length} bytes`)

		if (binary.length < 1024) {
			throw new Error(`Binary too small (${binary.length} bytes)`)
		}

		const magicByte = binary[0]
		console.log(`Magic byte: 0x${magicByte.toString(16)}`)

		if (magicByte !== 0xE9) {
			throw new Error(`Invalid magic byte: 0x${magicByte.toString(16)} (expected 0xE9)`)
		}

		return binary
	} catch (error) {
		if (error instanceof Error) {
			console.error("Error details:", {
				message: error.message,
				name: error.name,
				stack: error.stack
			})

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const execError = error as any
			if (execError.stdout) {
				try {
					const stdoutBuffer = Buffer.from(execError.stdout)
					console.info(`stdout length: ${stdoutBuffer.length} bytes`)
					if (stdoutBuffer.length > 0) {
						console.info(`stdout first byte: 0x${stdoutBuffer[0].toString(16)}`)
					}
				} catch (e) {
					console.error("Error processing stdout:", e)
				}
			}
			if (execError.stderr) {
				console.info("stderr:", execError.stderr.toString())
			}
		}
		throw error
	}
}
