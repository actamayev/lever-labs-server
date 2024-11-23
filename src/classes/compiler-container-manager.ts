/* eslint-disable @typescript-eslint/naming-convention */
import _ from "lodash"
import { promisify } from "util"
import { exec } from "child_process"
import { AssignPublicIp, DescribeTasksCommand, ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs"
import Singleton from "./singleton"
import SecretsManager from "./aws/secrets-manager"
import S3Manager from "./aws/s3-manager"

const execAsync = promisify(exec)

const FIRMWARE_PATH = "/Users/arieltamayev/Documents/PlatformIO/pip-bot-firmware"

export default class CompilerContainerManager extends Singleton {
	private containerId: string | null = null
	private isStarting = false
	private startPromise: Promise<void> | null = null
	private lastCompileTime: number = 0
	private compileCount: number = 0
	private totalCompileTime: number = 0
	private isWarmedUp = false
	private secretsManagerInstance: SecretsManager
	private ecsConfig?: ECSConfig
	private environment: CompilerEnvironment
	private ecsClient?: ECSClient

	private constructor() {
		super()
		this.environment = process.env.NODE_ENV
		this.secretsManagerInstance = SecretsManager.getInstance()

		if (this.environment !== "local") {
			void this.initializeECSConfig()
		} else {
			void this.startContainer()
		}
	}

	public static getInstance(): CompilerContainerManager {
		if (!CompilerContainerManager.instance) {
			CompilerContainerManager.instance = new CompilerContainerManager()
		}
		return CompilerContainerManager.instance
	}

	private async ensureCacheVolume(): Promise<void> {
		const pioCacheVolume = await this.secretsManagerInstance.getSecret("PIO_CACHE_VOLUME")
		try {
			await execAsync(`docker volume inspect ${pioCacheVolume}`)
		} catch (error) {
			console.error("Creating PlatformIO cache volume...", error)
			await execAsync(`docker volume create ${pioCacheVolume}`)
		}
	}

	private async initializeECSConfig(): Promise<void> {
		this.ecsConfig = {
			cluster: await this.secretsManagerInstance.getSecret("ECS_CLUSTER"),
			taskDefinition: await this.secretsManagerInstance.getSecret("ECS_TASK_DEFINITION"),
			subnet: await this.secretsManagerInstance.getSecret("ECS_SUBNET"),
			securityGroup: await this.secretsManagerInstance.getSecret("ECS_SECURITY_GROUP"),
			compiledBinaryOutputBucket: await this.secretsManagerInstance.getSecret("COMPILED_BINARY_OUTPUT_BUCKET"),
		}
		this.ecsClient = new ECSClient({
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			},

			region: this.region
		})
	}

	public async compile(userCode: string, pipUUID: PipUUID): Promise<Buffer> {
		if (this.environment === "local") {
			return await this.compileLocal(userCode, pipUUID)
		}
		return this.compileECS(userCode, pipUUID)
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
			const pioCacheVolume = await this.secretsManagerInstance.getSecret("PIO_CACHE_VOLUME")

			const { stdout } = await execAsync(
				`docker run -d \
                --name cpp-compiler-instance \
                --cpus=2 \
                --memory=2g \
				-e ENVIRONMENT=${process.env.NODE_ENV} \
                --memory-swap=4g \
                --memory-swappiness=60 \
                --shm-size=512m \
                -v "${FIRMWARE_PATH}:/workspace" \
                -v "${pioCacheVolume}:/root/.platformio" \
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
			const dummyPipUUID = "12345" as PipUUID
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
		try {
			const cleanUserCode = this.sanitizeUserCode(userCode)
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
			await this.handleCompilationError(error, userCode, pipUUID)
			throw error
		}
	}

	private async compileECS(userCode: string, pipUUID: PipUUID): Promise<Buffer> {
		try {
			if (!this.ecsConfig || !this.ecsClient) {
				throw new Error("ECS configuration not initialized")
			}

			const outputKeyValue = `${pipUUID}/output.bin`

			const params = {
				cluster: this.ecsConfig.cluster,
				taskDefinition: this.ecsConfig.taskDefinition,
				networkConfiguration: {
					awsvpcConfiguration: {
						subnets: [this.ecsConfig.subnet],
						securityGroups: [this.ecsConfig.securityGroup],
						assignPublicIp: AssignPublicIp.ENABLED
					}
				},
				overrides: {
					containerOverrides: [{
						name: `${process.env.NODE_ENV}-firmware-compiler`,
						environment: [
							{ name: "USER_CODE", value: this.sanitizeUserCode(userCode) },
							{ name: "PIP_ID", value: pipUUID },
							{ name: "COMPILED_BINARY_OUTPUT_BUCKET", value: this.ecsConfig.compiledBinaryOutputBucket },
							{ name: "OUTPUT_KEY", value: outputKeyValue }
						]
					}]
				}
			}

			const command = new RunTaskCommand(params)
			const { tasks } = await this.ecsClient.send(command)

			if (!tasks || _.isEmpty(tasks)) {
				throw new Error("Failed to start ECS task")
			}

			await this.waitForTaskCompletion(tasks[0].taskArn as string)
			return await S3Manager.getInstance().fetchOutputFromS3BinaryBucket(outputKeyValue)
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	// eslint-disable-next-line complexity
	private async waitForTaskCompletion(taskArn: string): Promise<void> {
		try {
			if (!this.ecsConfig || !this.ecsClient) {
				throw new Error("ECS configuration not initialized")
			}

			while (true) {
				const describeCommand = new DescribeTasksCommand({
					cluster: this.ecsConfig.cluster,
					tasks: [taskArn]
				})
				const { tasks } = await this.ecsClient.send(describeCommand)

				if (!tasks || _.isEmpty(tasks)) {
					throw new Error("Task not found")
				}

				if (tasks[0].lastStatus === "STOPPED") {
					// eslint-disable-next-line max-depth
					if (tasks[0].containers?.[0]?.exitCode !== 0) {
						throw new Error("ECS task failed")
					}
					return
				}

				await new Promise((resolve) => setTimeout(resolve, 1000))
			}
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	private sanitizeUserCode(userCode: string): string {
		return userCode.trim().replace(/'/g, "'\\''")
	}

	private async executeCompilation(
		containerId: string,
		userCode: string,
		pipUUID: PipUUID,
		isWarmup = false
	): Promise<Buffer> {
		if (!isWarmup) {
			console.log(`Compiling code in container: ${containerId}`)
		}

		const { stdout } = await execAsync(
			`docker exec \
			-e "USER_CODE='${userCode}'" \
			-e "PIP_ID=${pipUUID}" \
			cpp-compiler-instance /entrypoint.sh`,
			{
				encoding: "buffer",
				maxBuffer: 10 * 1024 * 1024,
				shell: "/bin/bash",
			}
		)

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!stdout || stdout.length === 0) {
			throw new Error("No binary output received from container")
		}

		return stdout
	}

	private async handleCompilationError(error: unknown, userCode: string, pipUUID: PipUUID): Promise<void> {
		if (error instanceof Error) {
			if (error.message.includes("No such container")) {
				console.log("Container not found, restarting...")
				this.containerId = null
				this.isWarmedUp = false
				await this.compile(userCode, pipUUID) // Retry compilation
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
}
