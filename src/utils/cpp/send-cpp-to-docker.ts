import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export default async function compileUserCode(userCode: string): Promise<Buffer> {
	// Clean up the user code
	const cleanUserCode = userCode.trim()

	console.log("User code to be passed:", cleanUserCode)

	try {
		const { stdout, stderr } = await execAsync(
			`docker run --rm \
            -e USER_CODE='${cleanUserCode}' \
            -v "/Users/arieltamayev/Documents/PlatformIO/pip-bot-firmware:/workspace" \
            cpp-compiler /entrypoint.sh`,
			{ encoding: "buffer", maxBuffer: 10 * 1024 * 1024 }
		)

		if (stderr) {
			console.error(`stderr: ${stderr.toString()}`)
		}

		return stdout
	} catch (error) {
		console.error(`Error compiling code: ${error}`)
		throw error
	}
}
