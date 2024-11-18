/* eslint-disable @typescript-eslint/naming-convention */
import _ from "lodash"
import { promisify } from "util"
import { exec } from "child_process"
import Singleton from "./singleton"

const execAsync = promisify(exec)

const FIRMWARE_PATH = "/Users/arieltamayev/Documents/PlatformIO/pip-bot-firmware"
const PIO_CACHE_VOLUME = "pio-cache"

export default class CompilerContainerManager extends Singleton {
	private containerId: string | null = null
	private isStarting = false
	private startPromise: Promise<void> | null = null
	private lastCompileTime: number = 0
	private compileCount: number = 0
	private totalCompileTime: number = 0

	private constructor() {
		super()
	}

	public static getInstance(): CompilerContainerManager {
		if (!CompilerContainerManager.instance) {
			CompilerContainerManager.instance = new CompilerContainerManager()
		}
		return CompilerContainerManager.instance
	}

	private async ensureCacheVolume(): Promise<void> {
		try {
			// Check if volume exists
			await execAsync(`docker volume inspect ${PIO_CACHE_VOLUME}`)
		} catch (error) {
			// Volume doesn't exist, create it
			console.log("Creating PlatformIO cache volume...")
			await execAsync(`docker volume create ${PIO_CACHE_VOLUME}`)
		}
	}

	private async startContainer(): Promise<void> {
		console.log("Starting container...")
		if (this.isStarting) {
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

			// Ensure cache volume exists
			await this.ensureCacheVolume()

			// Start new container with optimized settings
			const { stdout } = await execAsync(
				`docker run -d \
                --name cpp-compiler-instance \
                --cpus=2 \
                --memory=2g \
                --memory-swap=4g \
                --memory-swappiness=60 \
                --shm-size=512m \
                -v "${FIRMWARE_PATH}:/workspace" \
                -v "${PIO_CACHE_VOLUME}:/root/.platformio" \
                cpp-compiler tail -f /dev/null`
			)

			this.containerId = stdout.trim()
			console.log("Started compiler container with ID:", this.containerId)

			// Print container info for debugging
			const { stdout: inspect } = await execAsync(`docker inspect ${this.containerId}`)
			console.log("Container configuration:", inspect)

			// Log cache volume info
			const { stdout: volumeInfo } = await execAsync(`docker volume inspect ${PIO_CACHE_VOLUME}`)
			console.log("Cache volume info:", volumeInfo)

		} catch (error) {
			console.error("Failed to start container:", error)
			throw error
		}
	}

	private async cleanup(): Promise<void> {
		try {
			await execAsync("docker rm -f cpp-compiler-instance")
		} catch (error) {
			// Ignore error if container doesn't exist
			if (!(error as Error).message.includes("No such container")) {
				console.error(error)
				throw error
			}
		}
	}

	private async warmupContainer(): Promise<void> {
		if (!this.containerId) return

		try {
			console.log("Warming up container...")
			const dummyCode = "delay(1000);"
			await this.executeCompilation(this.containerId, dummyCode, true)
			console.log("Container warmup complete")
		} catch (error) {
			console.error("Container warmup failed:", error)
			// Continue despite warmup failure
		}
	}

	public async compile(userCode: string): Promise<Buffer> {
		if (!this.containerId) {
			await this.startContainer()
			await this.warmupContainer()
		}

		const startTime = Date.now()
		try {
			const cleanUserCode = this.sanitizeUserCode(userCode)
			const binary = await this.executeCompilation(this.containerId as string, cleanUserCode)

			// Update metrics
			const compileTime = Date.now() - startTime
			this.lastCompileTime = compileTime
			this.compileCount++
			this.totalCompileTime += compileTime

			console.log(`Compilation metrics:
                Last compile time: ${this.lastCompileTime}ms
                Average compile time: ${this.totalCompileTime / this.compileCount}ms
                Total compilations: ${this.compileCount}
            `)

			return binary
		} catch (error) {
			await this.handleCompilationError(error, userCode)
			throw error
		}
	}

	private sanitizeUserCode(userCode: string): string {
		return userCode.trim().replace(/'/g, "'\\''")
	}

	private async executeCompilation(
		containerId: string,
		userCode: string,
		isWarmup = false
	): Promise<Buffer> {
		console.log(`Compiling code in container: ${containerId} (Warmup: ${isWarmup})`)

		const { stdout, stderr } = await execAsync(
			`docker exec -e "USER_CODE='${userCode}'" cpp-compiler-instance /entrypoint.sh`,
			{
				encoding: "buffer",
				maxBuffer: 10 * 1024 * 1024,
				shell: "/bin/bash",
			}
		)

		this.handleStderr(stderr)

		if (!stdout || stdout.length === 0) {
			throw new Error("No binary output received from container")
		}

		return stdout
	}

	private handleStderr(stderr: Buffer): void {
		if (!stderr || _.isEmpty(stderr)) return
		const stderrStr = stderr.toString()
		if (!stderrStr.includes("Checking python version") &&
            !stderrStr.includes("Checking python dependencies")) {
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
		console.log("Shutting down container...")
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
