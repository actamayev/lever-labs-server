import _ from "lodash"
import { DescribeTasksCommand, ECSClient, RunTaskCommand, RunTaskCommandInput } from "@aws-sdk/client-ecs"
import S3Manager from "./s3-manager"
import Singleton from "../singleton"
import SecretsManager from "./secrets-manager"
import sanitizeUserCode from "../../utils/cpp/sanitize-user-code"

export default class ECSManager extends Singleton {
	private secretsManagerInstance: SecretsManager
	private ecsClient: ECSClient
	private ecsConfig!: ECSConfig

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
		void this.initializeECSConfig()
	}

	public static getInstance(): ECSManager {
		if (_.isNull(ECSManager.instance)) {
			ECSManager.instance = new ECSManager()
		}
		return ECSManager.instance
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

	public async compileECS(userCode: string, pipUUID: PipUUID): Promise<Buffer> {
		try {
			const outputKeyValue = `${pipUUID}/output.bin`

			const params: RunTaskCommandInput = {
				cluster: this.ecsConfig.cluster,
				taskDefinition: this.ecsConfig.taskDefinition,
				launchType: "EC2",
				overrides: {
					containerOverrides: [{
						name: `${process.env.NODE_ENV}-firmware-compiler-ec2-task`,
						environment: [
							{ name: "USER_CODE", value: sanitizeUserCode(userCode) },
							{ name: "ENVIRONMENT", value: process.env.NODE_ENV },
							{ name: "PIP_ID", value: pipUUID},
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

	// eslint-disable-next-line complexity, max-lines-per-function
	private async waitForTaskCompletion(taskArn: string): Promise<void> {
		try {
			while (true) {
				const describeCommand = new DescribeTasksCommand({
					cluster: this.ecsConfig.cluster,
					tasks: [taskArn]
				})
				const { tasks } = await this.ecsClient.send(describeCommand)

				if (!tasks || _.isEmpty(tasks)) {
					throw new Error("Task not found")
				}

				const task = tasks[0]
				console.log("Task Status:", task.lastStatus)
				console.log("Task Stopped Reason:", task.stoppedReason)

				// Log container details
				if (task.containers) {
					task.containers.forEach((container, index) => {
						console.log(`Container ${index} Details:`)
						console.log("  Name:", container.name)
						console.log("  Status:", container.lastStatus)
						console.log("  Exit Code:", container.exitCode)
						console.log("  Reason:", container.reason)

						// Log runtime ID if available
						if (container.runtimeId) {
							console.log("  Runtime ID:", container.runtimeId)
						}
					})
				}

				// Log network bindings if any
				if (task.attachments) {
					console.log("Network Details:", JSON.stringify(task.attachments, null, 2))
				}

				if (task.lastStatus === "STOPPED") {
					console.log("Task stopped with full details:", JSON.stringify(task, null, 2))

					if (task.containers?.[0]?.exitCode !== 0) {
						throw new Error(`ECS task failed: ${task.stoppedReason || "Unknown reason"}`)
					}
					return
				}

				await new Promise((resolve) => setTimeout(resolve, 1000))
			}
		} catch (error) {
			console.error("Task monitoring error:", error)

			// Add additional error context if available
			if (error instanceof Error) {
				console.error("Error details:", {
					message: error.message,
					name: error.name,
					stack: error.stack,
				})
			}

			throw error
		}
	}
}
