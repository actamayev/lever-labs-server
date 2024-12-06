import { promisify } from "util"
import { exec } from "child_process"
import Singleton from "./singleton"
import sanitizeUserCode from "../utils/cpp/sanitize-user-code"

const execAsync = promisify(exec)

export default class LocalCompilationManager extends Singleton {
	private containerId: string | null = null
	private isStarting = false
	private startPromise: Promise<void> | null = null
	private lastCompileTime: number = 0
	private compileCount: number = 0
	private totalCompileTime: number = 0
	private isWarmedUp = false
	private readonly localFirmwarePath = "/Users/arieltamayev/Documents/PlatformIO/pip-bot-firmware"

	private constructor() {
		super()
		void this.startContainer()
	}

	public static getInstance(): LocalCompilationManager {
		if (!LocalCompilationManager.instance) {
			LocalCompilationManager.instance = new LocalCompilationManager()
		}
		return LocalCompilationManager.instance
	}

	private async ensureCacheVolume(): Promise<void> {
		try {
			await execAsync("docker volume inspect pio-cache")
		} catch (error) {
			console.error("Creating PlatformIO cache volume...", error)
			await execAsync("docker volume create pio-cache")
		}
	}

	private async startContainer(): Promise<void> {
		try {
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
		} catch (error) {
			console.error(error)
			// Not throwing error because this is in the constructor (the instantiation of this class doesn't occur inside of a try block)
		}
	}

	private async doStartContainer(): Promise<void> {
		try {
			await this.cleanup()
			await this.ensureCacheVolume()

			const { stdout } = await execAsync(
				`docker run -d \
				--platform linux/amd64 \
				--name firmware-compiler-instance \
				--cpus=2 \
				--memory=2g \
				-e ENVIRONMENT=local \
				-e FIRMWARE_SOURCE=/firmware \
				--memory-swap=4g \
				--memory-swappiness=60 \
				--shm-size=512m \
				-v "${this.localFirmwarePath}:/firmware:ro" \
				-v "cpp-workspace-vol:/workspace" \
				-v "pio-cache:/root/.platformio" \
				firmware-compiler:latest tail -f /dev/null`
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
			await execAsync("docker rm -f firmware-compiler-instance")
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
			const dummyPipUUID = "12345" as PipUUID
			await execAsync("docker exec firmware-compiler-instance mkdir -p /workspace-temp")
			await this.executeCompilation(this.containerId, dummyCode, dummyPipUUID, true)
			this.isWarmedUp = true
			console.log("Container warmup complete")
		} catch (error) {
			console.error("Container warmup failed:", error)
			// Continue despite warmup failure
		}
	}

	public async compileLocal(userCode: string, pipUUID: PipUUID): Promise<Buffer> {
		if (!this.containerId || !this.isWarmedUp) {
			await this.startContainer()
		}

		const startTime = Date.now()
		const cleanUserCode = sanitizeUserCode(userCode)
		try {
			const binary = await this.executeCompilation(this.containerId as string, cleanUserCode, pipUUID)

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
			await this.handleCompilationError(error, cleanUserCode, pipUUID)
			throw error
		}
	}

	private async executeCompilation(
		containerId: string,
		userCode: string,
		pipUUID: PipUUID,
		isWarmup = false
	): Promise<Buffer> {
		try {
			if (!isWarmup) {
				console.log(`Compiling code in container: ${containerId}`)
			}

			await execAsync(
				`docker exec \
				-e USER_CODE='${sanitizeUserCode(userCode)}' \
				-e ENVIRONMENT=local \
				-e FIRMWARE_SOURCE=/firmware \
				-e PIP_ID=${pipUUID} \
				${isWarmup ? "-e WORKSPACE_DIR=/workspace-temp" : ""} \
				firmware-compiler-instance \
				bash -c "/entrypoint.sh >/dev/null"`,  // Redirect stdout to null
				{ maxBuffer: 5 * 1024 * 1024 }  // Increase stderr buffer
			)

			// Then just get the binary file with smaller buffer
			const { stdout } = await execAsync(
				"docker exec firmware-compiler-instance cat /workspace/.pio/build/local/firmware.bin",
				{ encoding: "buffer" }
			)

			// Clean up temp workspace after warmup
			if (isWarmup) {
				await execAsync("docker exec firmware-compiler-instance rm -rf /workspace-temp")
			}

			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			if (!stdout || stdout.length === 0) {
				throw new Error("No binary output received from container")
			}

			return stdout
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	private async handleCompilationError(error: unknown, userCode: string, pipUUID: PipUUID): Promise<void> {
		if (error instanceof Error) {
			if (error.message.includes("No such container")) {
				console.log("Container not found, restarting...")
				this.containerId = null
				this.isWarmedUp = false
				await this.compileLocal(userCode, pipUUID) // Retry compilation
				return
			}

			try {
				const { stdout: logs } = await execAsync("docker logs firmware-compiler-instance")
				console.error("Container logs:", logs)
			} catch (logError) {
				console.error("Failed to get container logs:", logError)
			}
		}
	}
}
