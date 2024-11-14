import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export default async function compileUserCode(userCode: string): Promise<Buffer> {
	// Clean up the user code
	const cleanUserCode = userCode.trim()

	console.log("User code to be passed:", cleanUserCode)

	// Escape the code for shell
	const escapedCode = cleanUserCode.replace(/'/g, "'\\''")

	try {
		const { stdout, stderr } = await execAsync(
			// eslint-disable-next-line max-len
			`docker run --rm -e "USER_CODE='${escapedCode}'" -v "/Users/arieltamayev/Documents/PlatformIO/pip-bot-firmware:/workspace" cpp-compiler /entrypoint.sh`,
			{
				encoding: "buffer",
				maxBuffer: 10 * 1024 * 1024,
				shell: "/bin/bash"
			}
		)

		if (stderr.length > 0) {
			const stderrStr = stderr.toString()
			if (!stderrStr.includes("Checking python version") &&
                !stderrStr.includes("Checking python dependencies")) {
				console.error(`stderr: ${stderrStr}`)
			}
		}

		return stdout
	} catch (error) {
		if (error instanceof Error) {
			console.error("Error compiling code:", error.message)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const execError = error as any
			if (execError.stdout) console.log("stdout:", execError.stdout.toString())
			if (execError.stderr) console.log("stderr:", execError.stderr.toString())
		}
		throw error
	}
}
