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
	private isWarmedUp = false

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
			await execAsync(`docker volume inspect ${PIO_CACHE_VOLUME}`)
		} catch (error) {
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
			await this.warmupContainer()  // Warmup after container starts
		} finally {
			this.isStarting = false
			this.startPromise = null
		}
	}

	private async doStartContainer(): Promise<void> {
		try {
			await this.cleanup()
			await this.ensureCacheVolume()

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

			await execAsync(`docker inspect ${this.containerId}`)

		} catch (error) {
			console.error("Failed to start container:", error)
			throw error
		}
	}

	private async cleanup(): Promise<void> {
		try {
			await execAsync("docker rm -f cpp-compiler-instance")
		} catch (error) {
			if (!(error as Error).message.includes("No such container")) {
				console.error(error)
				throw error
			}
		}
	}

	private async warmupContainer(): Promise<void> {
		if (!this.containerId || this.isWarmedUp) return

		try {
			console.log("Warming up container...")
			const dummyCode = "delay(1000);"
			await this.executeCompilation(this.containerId, dummyCode, true)
			this.isWarmedUp = true
			console.log("Container warmup complete")
		} catch (error) {
			console.error("Container warmup failed:", error)
			// Continue despite warmup failure
		}
	}

	public async compile(userCode: string): Promise<Buffer> {
		if (!this.containerId || !this.isWarmedUp) {
			await this.startContainer()
		}

		const startTime = Date.now()
		try {
			const cleanUserCode = this.sanitizeUserCode(userCode)
			const binary = await this.executeCompilation(this.containerId as string, cleanUserCode)

			// Update metrics only for non-warmup compilations
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
		if (!isWarmup) {
			console.log(`Compiling code in container: ${containerId}`)
		}

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
				this.isWarmedUp = false
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
		this.isWarmedUp = false
	}

	public getMetrics(): { lastCompileTime: number; averageCompileTime: number; totalCompiles: number } {
		return {
			lastCompileTime: this.lastCompileTime,
			averageCompileTime: this.compileCount ? this.totalCompileTime / this.compileCount : 0,
			totalCompiles: this.compileCount
		}
	}
}
