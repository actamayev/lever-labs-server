import _ from "lodash"
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
		console.log("starting container")
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
		if (!this.containerId) await this.startContainer()

		try {
			const cleanUserCode = this.sanitizeUserCode(userCode)
			return await this.executeCompilation(this.containerId as string, cleanUserCode)
		} catch (error) {
			await this.handleCompilationError(error, userCode)
			throw error
		}
	}

	private sanitizeUserCode(userCode: string): string {
		return userCode.trim().replace(/'/g, "'\\''")
	}

	private async executeCompilation(containerId: string | null, userCode: string): Promise<Buffer> {
		console.log("Compiling code in container:", containerId)

		const { stdout, stderr } = await execAsync(
			`docker exec -e "USER_CODE='${userCode}'" cpp-compiler-instance /entrypoint.sh`,
			{
				encoding: "buffer",
				maxBuffer: 10 * 1024 * 1024,
				shell: "/bin/bash",
			}
		)

		this.handleStderr(stderr)

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!stdout || stdout.length === 0) {
			throw new Error("No binary output received from container")
		}

		return stdout
	}

	private handleStderr(stderr: Buffer): void {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!stderr || _.isEmpty(stderr)) return
		const stderrStr = stderr.toString()
		if (!stderrStr.includes("Checking python version") && !stderrStr.includes("Checking python dependencies")) {
			console.error(`stderr: ${stderrStr}`)
		}
	}

	private async handleCompilationError(error: unknown, userCode: string): Promise<void> {
		if (error instanceof Error) {
			if (error.message.includes("No such container")) {
				console.log("Container not found, restarting...")
				this.containerId = null
				await this.compile(userCode) // Retry compilation
				return
			}

			try {
				const { stdout: logs } = await execAsync("docker logs cpp-compiler-instance")
				console.error("Container logs:", logs)
			} catch (logError) {
				console.error("Failed to get container logs:", logError)
			}
		}
	}

	public async shutdown(): Promise<void> {
		if (!this.containerId) return
		console.log("shutting down")
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
