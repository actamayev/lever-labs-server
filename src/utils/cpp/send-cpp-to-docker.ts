import path from "path"
import * as fs from "fs/promises"
import { exec } from "child_process"

export default async function compileUserCode(userCode: string): Promise<Buffer> {
	// Define paths
	const firmwarePath = "/Users/arieltamayev/Documents/PlatformIO/pip-bot-firmware"
	const firmwareBuildPath = path.join(firmwarePath, ".pio/build/esp32dev")

	// Clean up the user code by removing any trailing newlines or spaces
	const cleanUserCode = userCode.trim()

	console.log("User code to be passed:", cleanUserCode)

	// Run Docker command with the user code as an environment variable
	await new Promise<void>((resolve, reject) => {
		// eslint-disable-next-line security/detect-child-process
		exec(
			`docker run --rm \
            -e USER_CODE='${cleanUserCode}' \
            -v "${firmwarePath}:/workspace" \
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
	try {
		const binary = await fs.readFile(path.join(firmwareBuildPath, "firmware.bin"))
		return binary
	} catch (error) {
		console.error("Error reading firmware binary:", error)
		throw new Error("Failed to read compiled firmware binary")
	}
}
