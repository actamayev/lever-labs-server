import path from "path"
import * as fs from "fs/promises"
import { exec } from "child_process"

export default async function compileUserCode(userCode: string): Promise<Buffer> {
	const buildPath = path.join(process.cwd(), "build/build/firmware.bin")

	// Structure the user code as a string to be used in the Docker container
	const structuredUserCode = `
		#include <Wire.h>
		#include "config.h"

		void user_code() {
			${userCode}
		}
	`

	// Run Docker command with the user code as an environment variable
	await new Promise<void>((resolve, reject) => {
		// eslint-disable-next-line security/detect-child-process
		exec(
			`docker run --rm \
			-e USER_CODE="${structuredUserCode.replace(/"/g, "\\\"").replace(/\n/g, "\\n")}" \
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
					return reject(new Error(stderr))
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
