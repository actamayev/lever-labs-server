import _ from "lodash"
import { AssignPublicIp, DescribeTasksCommand, ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs"
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
		this.ecsConfig = {
			cluster: await this.secretsManagerInstance.getSecret("ECS_CLUSTER"),
			taskDefinition: await this.secretsManagerInstance.getSecret("ECS_TASK_DEFINITION"),
			subnet: await this.secretsManagerInstance.getSecret("ECS_SUBNET"),
			securityGroup: await this.secretsManagerInstance.getSecret("ECS_SECURITY_GROUP"),
			compiledBinaryOutputBucket: await this.secretsManagerInstance.getSecret("COMPILED_BINARY_OUTPUT_BUCKET"),
		}
	}

	public async compileECS(userCode: string, pipUUID: PipUUID): Promise<Buffer> {
		try {
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
							{ name: "USER_CODE", value: sanitizeUserCode(userCode) },
							{ name: "ENVIRONMENT", value: process.env.NODE_ENV },
							{ name: "PIP_ID", value: pipUUID},
							// value: `-DDEFAULT_ENVIRONMENT=\\"${process.env.NODE_ENV}\\" -DDEFAULT_PIP_ID=\\"${pipUUID}\\"`
							// },
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

	private async waitForTaskCompletion(taskArn: string): Promise<void> {
		try {
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
}
