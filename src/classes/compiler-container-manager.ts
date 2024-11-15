// container-manager.ts
import { promisify } from "util"
import { exec } from "child_process"
import Singleton from "./singleton"

const execAsync = promisify(exec)

export default class CompilerContainerManager extends Singleton {
	private containerId: string | null = null
	private isStarting = false
	private startPromise: Promise<void> | null = null

	private constructor() {
		super()
	}

	public static getInstance(): CompilerContainerManager {
		if (!CompilerContainerManager.instance) {
			CompilerContainerManager.instance = new CompilerContainerManager()
		}
		return CompilerContainerManager.instance
	}

	private async startContainer(): Promise<void> {
		if (this.isStarting) {
			// If container is already starting, wait for it
			return this.startPromise as Promise<void>
		}

		this.isStarting = true
		this.startPromise = this.doStartContainer()

		try {
			await this.startPromise
		} finally {
			this.isStarting = false
			this.startPromise = null
		}
	}

	private async doStartContainer(): Promise<void> {
		try {
			// First, clean up any existing container
			await this.cleanup()

			// Start new container in detached mode
			const { stdout } = await execAsync(
				"docker run -d \
                --name cpp-compiler-instance \
                -v \"/Users/arieltamayev/Documents/PlatformIO/pip-bot-firmware:/workspace\" \
                -v \"pio-cache:/root/.platformio\" \
                --cpus=2 \
                --memory=2g \
                cpp-compiler tail -f /dev/null"  // Keep container running
			)

			this.containerId = stdout.trim()
			console.log("Started compiler container with ID:", this.containerId)
		} catch (error) {
			console.error("Failed to start container:", error)
			throw error
		}
	}

	private async cleanup(): Promise<void> {
		try {
			await execAsync("docker rm -f cpp-compiler-instance")
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	public async compile(userCode: string): Promise<Buffer> {
		if (!this.containerId) {
			await this.startContainer()
		}

		try {
			const cleanUserCode = userCode.trim()
			console.log("Compiling code in container:", this.containerId)

			const { stdout, stderr } = await execAsync(
				`docker exec \
                -e "USER_CODE=${cleanUserCode}" \
                cpp-compiler-instance \
                /entrypoint.sh`,
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
			// If container is gone, try to restart it and compile again
			if (error instanceof Error && error.message.includes("No such container")) {
				console.log("Container not found, restarting...")
				this.containerId = null
				return this.compile(userCode)
			}
			throw error
		}
	}

	public async shutdown(): Promise<void> {
		if (!this.containerId) return
		await this.cleanup()
		this.containerId = null
	}
}

// Add cleanup on process exit
process.on("SIGINT", async () => {
	await CompilerContainerManager.getInstance().shutdown()
	process.exit()
})

process.on("SIGTERM", async () => {
	await CompilerContainerManager.getInstance().shutdown()
	process.exit()
})
