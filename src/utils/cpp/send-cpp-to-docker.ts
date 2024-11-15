import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export default async function compileUserCode(userCode: string): Promise<Buffer> {
	const cleanUserCode = userCode.trim()
	console.log("User code to be passed:", cleanUserCode)

	try {
		const { stdout, stderr } = await execAsync(
			`docker run --rm \
            -e "USER_CODE=${cleanUserCode}" \
            -v "/Users/arieltamayev/Documents/PlatformIO/pip-bot-firmware:/workspace" \
            -v "pio-cache:/root/.platformio" \
            --cpus=2 \
            --memory=2g \
            cpp-compiler /entrypoint.sh`,
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
			if (execError.stdout) console.info("stdout:", execError.stdout.toString())
			if (execError.stderr) console.info("stderr:", execError.stderr.toString())
		}
		throw error
	}
}
