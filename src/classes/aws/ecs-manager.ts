/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from "lodash"
import { DescribeTasksCommand, ECSClient, ExecuteCommandCommand,
	ExecuteCommandCommandInput, ListTasksCommand, RunTaskCommand, RunTaskCommandInput } from "@aws-sdk/client-ecs"
import S3Manager from "./s3-manager"
import Singleton from "../singleton"
import SecretsManager from "./secrets-manager"
import sanitizeUserCode from "../../utils/cpp/sanitize-user-code"

export default class ECSManager extends Singleton {
	private secretsManagerInstance: SecretsManager
	private ecsClient: ECSClient
	private ecsConfig!: ECSConfig
	private runningTaskArn: string | undefined = undefined

	private constructor() {
		super()
		this.secretsManagerInstance = SecretsManager.getInstance()
		this.ecsClient = new ECSClient({
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			},

			region: this.region
		})
		void this.initialize()
	}

	public static getInstance(): ECSManager {
		if (_.isNull(ECSManager.instance)) {
			ECSManager.instance = new ECSManager()
		}
		return ECSManager.instance
	}

	private async initialize(): Promise<void> {
		try {
			await this.initializeECSConfig()
			await this.ensureCompilerContainerRunning()
		} catch (error) {
			console.error("Failed to initialize ECS Manager:", error)
			// Continue initialization even if container start fails
		}
	}

	private async initializeECSConfig(): Promise<void> {
		try {
			const secretKeys: SecretKeys[] = [
				"ECS_CLUSTER",
				"ECS_TASK_DEFINITION",
				"ECS_SUBNET",
				"ECS_SECURITY_GROUP",
				"COMPILED_BINARY_OUTPUT_BUCKET"
			]

			const secrets = await this.secretsManagerInstance.getSecrets(secretKeys)

			this.ecsConfig = {
				cluster: secrets["ECS_CLUSTER"],
				taskDefinition: secrets["ECS_TASK_DEFINITION"],
				subnet: secrets["ECS_SUBNET"],
				securityGroup: secrets["ECS_SECURITY_GROUP"],
				compiledBinaryOutputBucket: secrets["COMPILED_BINARY_OUTPUT_BUCKET"],
			}
		} catch (error) {
			console.error(error)
			// Not throwing error because this is in the constructor (the instantiation of this class doesn't occur inside of a try block)
		}
	}

	// eslint-disable-next-line max-lines-per-function
	private async ensureCompilerContainerRunning(): Promise<void> {
		try {
			console.log("Checking for running compiler container...")

			const listTasksResponse = await this.ecsClient.send(new ListTasksCommand({
				cluster: this.ecsConfig.cluster,
				family: this.ecsConfig.taskDefinition
			}))

			if (!listTasksResponse.taskArns || listTasksResponse.taskArns.length === 0) {
				console.log("No compiler container found, starting new one...")

				const startParams: RunTaskCommandInput = {
					cluster: this.ecsConfig.cluster,
					taskDefinition: this.ecsConfig.taskDefinition,
					launchType: "EC2",
					enableExecuteCommand: true,
					overrides: {
						containerOverrides: [{
							name: `${process.env.NODE_ENV}-firmware-compiler-ec2-task`,
							environment: [
								{ name: "USER_CODE", value: "delay(1000);" },
								{ name: "ENVIRONMENT", value: process.env.NODE_ENV },
								{ name: "PIP_ID", value: "warmup" }
								// { name: "WARMUP", value: "true" }
							]
						}]
					}
				}

				const startResponse = await this.ecsClient.send(new RunTaskCommand(startParams))
				if (!startResponse.tasks || startResponse.tasks.length === 0) {
					throw new Error("Failed to start compiler container")
				}

				this.runningTaskArn = startResponse.tasks[0].taskArn as string
				await this.waitForContainerStart()
				console.log("Compiler container started successfully")
			} else {
				this.runningTaskArn = listTasksResponse.taskArns[0]
				console.log("Found existing compiler container:", this.runningTaskArn)
			}
		} catch (error) {
			console.error("Failed to ensure compiler container is running:", error)
			throw error
		}
	}

	private async waitForContainerStart(): Promise<void> {
		console.log("Waiting for container to start...")
		const maxAttempts = 30
		let attempts = 0

		while (attempts < maxAttempts) {
			const describeCommand = new DescribeTasksCommand({
				cluster: this.ecsConfig.cluster,
				tasks: [this.runningTaskArn as string]
			})

			const { tasks } = await this.ecsClient.send(describeCommand)

			if (!tasks || tasks.length === 0) {
				throw new Error("Task not found during startup")
			}

			const task = tasks[0]
			console.log("Container status:", task.lastStatus)

			if (task.lastStatus === "RUNNING") {
				return
			} else if (task.lastStatus === "STOPPED") {
				throw new Error(`Container stopped during startup: ${task.stoppedReason}`)
			}

			await new Promise(resolve => setTimeout(resolve, 1000))
			attempts++
		}

		throw new Error("Container startup timed out")
	}

	// eslint-disable-next-line max-lines-per-function
	public async compileECS(userCode: string, pipUUID: PipUUID): Promise<Buffer> {
		try {
			if (!this.runningTaskArn) {
				await this.ensureCompilerContainerRunning()
			}

			const outputKeyValue = `${pipUUID}/output.bin`

			// Debug commands to check caching
			const debugCommands = [
				"echo '=== Checking PlatformIO Cache ==='",
				"ls -la /root/.platformio/cache",
				"echo '=== Checking Workspace ==='",
				"ls -la /workspace",
				"echo '=== Checking Build Directory ==='",
				"ls -la /workspace/.pio/build/staging",
				"echo '=== Current Environment ==='",
				"env",
			].join(" && ")

			// Execute debug commands
			const debugParams: ExecuteCommandCommandInput = {
				cluster: this.ecsConfig.cluster,
				task: this.runningTaskArn,
				container: `${process.env.NODE_ENV}-firmware-compiler-ec2-task`,
				interactive: true,
				command: `/bin/bash -c "${debugCommands}"`
			}

			console.log("Running debug commands...")
			await this.ecsClient.send(new ExecuteCommandCommand(debugParams))

			// Clean workspace before compilation
			const cleanCommand = "rm -rf /workspace/.pio/build/* /workspace/src/*"
			const cleanParams: ExecuteCommandCommandInput = {
				cluster: this.ecsConfig.cluster,
				task: this.runningTaskArn,
				container: `${process.env.NODE_ENV}-firmware-compiler-ec2-task`,
				interactive: true,
				command: `/bin/bash -c "${cleanCommand}"`
			}

			console.log("Cleaning workspace...")
			await this.ecsClient.send(new ExecuteCommandCommand(cleanParams))

			// Original compilation command
			const commandString = [
				"set -x",  // Enable command tracing
				"cd /workspace",
				"echo 'Starting compilation at: ' $(date)",
				"ls -la /workspace",  // Show workspace state before
				"echo 'User code:' '$USER_CODE'",
				"bash -x /entrypoint.sh 2>&1 | tee /tmp/compile.log",  // Capture full entrypoint output
				"echo 'Compilation finished at: ' $(date)",
				"echo 'Build output:'",
				"ls -la /workspace/.pio/build/staging/",
				"echo 'Binary hash:'",
				"md5sum /workspace/.pio/build/staging/firmware.bin",
				"aws s3 cp --debug /workspace/.pio/build/staging/firmware.bin s3://${COMPILED_BINARY_OUTPUT_BUCKET}/${OUTPUT_KEY}",
				"echo 'Upload finished at: ' $(date)"
			].join(" && ")

			const execParams: ExecuteCommandCommandInput = {
				cluster: this.ecsConfig.cluster,
				task: this.runningTaskArn,
				container: `${process.env.NODE_ENV}-firmware-compiler-ec2-task`,
				interactive: true,
				command: `/bin/bash -c "${commandString}"`
			}

			console.log("Executing compilation in container...")
			await this.ecsClient.send(new ExecuteCommandCommand(execParams))

			// Add retry logic for S3 fetch with logging
			const maxRetries = 30
			let retries = 0
			while (retries < maxRetries) {
				try {
					const output = await S3Manager.getInstance().fetchOutputFromS3BinaryBucket(outputKeyValue)
					console.log(`Successfully fetched binary from S3, size: ${output.length} bytes`)
					return output
				} catch (error) {
					console.log(`Retry ${retries + 1}/${maxRetries} fetching from S3...`)
					if (retries === maxRetries - 1) throw error
					await new Promise(resolve => setTimeout(resolve, 1000))
					retries++
				}
			}

			throw new Error("Failed to fetch compilation output")
		} catch (error) {
			// If the task died, clear the cached ARN and retry once
			if ((error as any)?.message?.includes("STOPPED")) {
				console.log("Container stopped, attempting restart...")
				this.runningTaskArn = undefined
				return this.compileECS(userCode, pipUUID)
			}
			console.error("ECS Task Error:", error)
			throw error
		}
	}
}
