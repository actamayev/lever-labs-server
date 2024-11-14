import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export default async function compileUserCode(userCode: string): Promise<Buffer> {
	// Clean up the user code and escape it for shell
	const cleanUserCode = userCode.trim().replace(/'/g, "'\\''")

	console.log("User code to be passed:", cleanUserCode)

	try {
		const { stdout, stderr } = await execAsync(
			`docker run --rm \
            -e "USER_CODE=${cleanUserCode}" \
            -v "/Users/arieltamayev/Documents/PlatformIO/pip-bot-firmware:/workspace" \
            cpp-compiler /entrypoint.sh`,
			{
				encoding: "buffer",
				maxBuffer: 10 * 1024 * 1024,
				shell: "/bin/bash"
			}
		)

		if (stderr.length > 0) {
			const stderrStr = stderr.toString()
			// Only log actual errors, not the standard PlatformIO output
			if (!stderrStr.includes("Checking python version") &&
                !stderrStr.includes("Checking python dependencies")) {
				console.error(`stderr: ${stderrStr}`)
			}
		}

		return stdout
	} catch (error) {
		console.error(`Error compiling code: ${error}`)
		throw error
	}
}
