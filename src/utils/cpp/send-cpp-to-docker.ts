import CompilerContainerManager from "../../classes/compiler-container-manager"

export default async function compileUserCode(userCode: string): Promise<Buffer> {
	try {
		const compiler = CompilerContainerManager.getInstance()
		const binary = await compiler.compile(userCode)

		// Enhanced verification
		console.log(`Binary size: ${binary.length} bytes`)

		// ESP32 binary should start with 0xE9
		if (binary.length < 1024) {
			throw new Error(`Binary too small (${binary.length} bytes)`)
		}

		const magicByte = binary[0]
		console.log(`Magic byte: 0x${magicByte.toString(16)}`)
		console.log(`First 16 bytes: ${binary.slice(0, 16).toString("hex")}`)

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
				const stdoutBuffer = Buffer.from(execError.stdout)
				console.info(`stdout length: ${stdoutBuffer.length} bytes`)
				console.info(`stdout first byte: 0x${stdoutBuffer[0].toString(16)}`)
			}
			if (execError.stderr) {
				console.info("stderr:", execError.stderr.toString())
			}
		}
		throw error
	}
}
