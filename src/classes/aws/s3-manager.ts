import { isNull } from "lodash"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import Singleton from "../singleton"
import SecretsManager from "./secrets-manager"

export default class AwsS3 extends Singleton {
	private s3: S3Client
	private secretsManagerInstance: SecretsManager

	private constructor() {
		super()
		this.secretsManagerInstance = SecretsManager.getInstance()
		this.s3 = new S3Client({
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			},

			region: this.region
		})
	}

	public static getInstance(): AwsS3 {
		if (isNull(AwsS3.instance)) {
			AwsS3.instance = new AwsS3()
		}
		return AwsS3.instance
	}

	public async uploadImage(fileBuffer: Buffer, imageUUID: ProjectUUID): Promise<string> {
		try {
			const s3BucketName = await this.secretsManagerInstance.getSecret("BDR_S3_BUCKET")

			const key = `profile-pictures/${imageUUID}`
			const command = new PutObjectCommand({
				Bucket: s3BucketName,
				Key: key,
				Body: fileBuffer,
				ContentType: "image/jpeg"
			})
			await this.s3.send(command)
			return `https://${s3BucketName}.s3.us-east-1.amazonaws.com/${key}`
		} catch (error) {
			console.error("Error uploading image to S3:", error)
			throw error
		}
	}
}
