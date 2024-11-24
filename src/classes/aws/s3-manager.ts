import _ from "lodash"
import { Readable } from "stream"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import Singleton from "../singleton"
import SecretsManager from "./secrets-manager"

export default class S3Manager extends Singleton {
	private s3Client: S3Client
	private secretsManagerInstance: SecretsManager

	private constructor() {
		super()
		this.secretsManagerInstance = SecretsManager.getInstance()
		this.s3Client = new S3Client({
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			},

			region: this.region
		})
	}

	public static getInstance(): S3Manager {
		if (_.isNull(S3Manager.instance)) {
			S3Manager.instance = new S3Manager()
		}
		return S3Manager.instance
	}

	public async fetchOutputFromS3BinaryBucket(key: string): Promise<Buffer> {
		try {
			const compiledBinaryOutputBucket = await this.secretsManagerInstance.getSecret("COMPILED_BINARY_OUTPUT_BUCKET")
			const s3Command = new GetObjectCommand({
				Bucket: compiledBinaryOutputBucket,
				Key: key
			})

			const response = await this.s3Client.send(s3Command)

			if (!response.Body) {
				throw new Error("Failed to fetch output from S3")
			}

			const streamToBuffer = (stream: Readable): Promise<Buffer> =>
				new Promise((resolve, reject) => {
					const chunks: Uint8Array[] = []
					stream.on("data", (chunk) => chunks.push(chunk))
					stream.on("error", reject)
					stream.on("end", () => resolve(Buffer.concat(chunks)))
				})

			return streamToBuffer(response.Body as Readable)
		} catch (error) {
			console.error(error)
			throw error
		}
	}

}
