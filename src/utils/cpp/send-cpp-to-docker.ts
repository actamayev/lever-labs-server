import path from "path"
import * as fs from "fs/promises"
import { exec } from "child_process"

export default async function compileUserCode(userCode: string): Promise<Buffer> {
	// Define paths
	const userCodePath = path.join(process.cwd(), "user_code.cpp")
	const buildPath = path.join(process.cwd(), "build/build/firmware.bin")

	// Save user code to a temporary file
	await fs.writeFile(userCodePath, userCode)

	// Run Docker command to compile the code asynchronously
	await new Promise<void>((resolve, reject) => {
		exec(
			`docker run --rm \
			-v "/Users/arieltamayev/Documents/PlatformIO/pip-bot-firmware:/workspace" \
			-v "${path.join(process.cwd(), "build")}:/workspace/build" \
			cpp-compiler /entrypoint.sh "$(cat ${userCodePath})"`,
			(error, stdout, stderr) => {
				if (error) {
					console.error(`Error: ${error.message}`)
					return reject(error)
				}
				if (stderr) {
					console.error(`stderr: ${stderr}`)
					return reject(new Error(stderr))
				}
				console.log(`stdout: ${stdout}`)
				resolve()
			}
		)
	})

	// Read and return the compiled binary
	const binary = await fs.readFile(buildPath)
	return binary
}
