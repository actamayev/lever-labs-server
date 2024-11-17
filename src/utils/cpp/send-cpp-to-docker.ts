import CompilerContainerManager from "../../classes/compiler-container-manager"

export default async function compileUserCode(userCode: string): Promise<Buffer> {
	try {
		const binary = await compileCode(userCode)
		validateBinary(binary)
		return binary
	} catch (error) {
		handleCompilationError(error)
		throw error
	}
}

async function compileCode(userCode: string): Promise<Buffer> {
	const binary = await CompilerContainerManager.getInstance().compile(userCode)

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (!binary || binary.length === 0) {
		throw new Error("No binary data received from compilation")
	}

	console.info(`Binary size: ${binary.length} bytes`)
	return binary
}

function validateBinary(binary: Buffer): void {
	if (binary.length < 1024) {
		throw new Error(`Binary too small (${binary.length} bytes)`)
	}

	const magicByte = binary[0]
	console.info(`Magic byte: 0x${magicByte.toString(16)}`)

	if (magicByte !== 0xE9) {
		throw new Error(`Invalid magic byte: 0x${magicByte.toString(16)} (expected 0xE9)`)
	}
}

function handleCompilationError(error: unknown): void {
	if (!(error instanceof Error)) return
	console.error("Error details:", {
		message: error.message,
		name: error.name,
		stack: error.stack,
	})

	const execError = error as any // eslint-disable-line @typescript-eslint/no-explicit-any
	processExecError(execError)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processExecError(execError: any): void {
	try {
		if (execError.stdout) {
			const stdoutBuffer = Buffer.from(execError.stdout)
			console.info(`stdout length: ${stdoutBuffer.length} bytes`)
			if (stdoutBuffer.length > 0) {
				console.info(`stdout first byte: 0x${stdoutBuffer[0].toString(16)}`)
			}
		}
		if (execError.stderr) {
			console.info("stderr:", execError.stderr.toString())
		}
	} catch (error) {
		console.error("Error processing stdout:", error)
	}
}
