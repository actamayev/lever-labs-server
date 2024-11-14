import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export default async function compileUserCode(userCode: string): Promise<Buffer> {
	// Clean up the user code and convert to base64
	const cleanUserCode = userCode.trim()
	const base64Code = Buffer.from(cleanUserCode).toString("base64")

	console.log("Original user code:", cleanUserCode)
	console.log("Base64 encoded code:", base64Code)

	// Construct docker command with proper quoting
	const dockerCmd = [
		"docker run --rm",
		`-e 'USER_CODE_BASE64=${base64Code}'`,
		"-v \"/Users/arieltamayev/Documents/PlatformIO/pip-bot-firmware:/workspace\"",
		"cpp-compiler",
		"/entrypoint.sh"
	].join(" ")

	console.log("Running docker command:", dockerCmd)

	try {
		const { stdout, stderr } = await execAsync(dockerCmd, {
			encoding: "buffer",
			maxBuffer: 10 * 1024 * 1024,
			shell: "/bin/bash"
		})

		if (stderr.length > 0) {
			const stderrStr = stderr.toString()
			console.log("Full stderr:", stderrStr)
		}

		return stdout
	} catch (error) {
		if (error instanceof Error) {
			console.error("Error compiling code:", error.message)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const execError = error as any
			if (execError.stdout) console.log("Full stdout:", execError.stdout.toString())
			if (execError.stderr) console.log("Full stderr:", execError.stderr.toString())
		}
		throw error
	}
}
