import path from "path"
import * as fs from "fs/promises"
import { exec } from "child_process"

export default async function compileUserCode(userCode: string): Promise<Buffer> {
	const buildPath = path.join(process.cwd(), "build/build/firmware.bin")

	// Don't wrap the code - just pass it as-is
	console.log("User code to be passed:", userCode)

	// Run Docker command with the user code as an environment variable
	await new Promise<void>((resolve, reject) => {
		// eslint-disable-next-line security/detect-child-process
		exec(
			`docker run --rm \
            -e USER_CODE=${JSON.stringify(userCode)} \
            -v "/Users/arieltamayev/Documents/PlatformIO/pip-bot-firmware:/workspace" \
            -v "${path.join(process.cwd(), "build")}:/workspace/build" \
            cpp-compiler /entrypoint.sh`,
			(error, stdout, stderr) => {
				if (error) {
					console.error(`Error: ${error.message}`)
					return reject(error)
				}
				if (stderr) {
					console.error(`stderr: ${stderr}`)
				}
				console.log(`stdout: ${stdout}`)
				resolve()
			}
		)
	})

	// Read and return the compiled firmware binary
	const binary = await fs.readFile(buildPath)
	return binary
}
