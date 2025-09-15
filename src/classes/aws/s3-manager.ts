import { Readable } from "stream"
import { isEmpty, isNull } from "lodash"
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
import Singleton from "../singleton"
import SecretsManager from "./secrets-manager"

export default class AwsS3 extends Singleton {
	private s3: S3Client

	private constructor() {
		super()
		this.s3 = new S3Client({
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			},
			region: this.region
		})
	}

	public static override getInstance(): AwsS3 {
		if (isNull(AwsS3.instance)) {
			AwsS3.instance = new AwsS3()
		}
		return AwsS3.instance
	}

	public async uploadImage(fileBuffer: Buffer, imageUUID: string): Promise<string> {
		try {
			const s3BucketName = await SecretsManager.getInstance().getSecret("BDR_S3_BUCKET")

			const key = `profile-pictures/${imageUUID}`
			const command = new PutObjectCommand({
				Bucket: s3BucketName,
				Key: key,
				Body: fileBuffer,
				ContentType: "image/jpeg"
			})
			await this.s3.send(command)
			return `https://${s3BucketName}.s3.${this.region}.amazonaws.com/${key}`
		} catch (error) {
			console.error("Error uploading image to S3:", error)
			throw error
		}
	}

	private async getLatestFirmwareVersion(): Promise<{version: number, key: string}> {
		try {
			const firmwareBucket = await SecretsManager.getInstance().getSecret("FIRMWARE_S3_BUCKET")

			const listCommand = new ListObjectsV2Command({
				Bucket: firmwareBucket
			})

			const listedObjects = await this.s3.send(listCommand)

			if (!listedObjects.Contents || isEmpty(listedObjects.Contents)) {
				throw new Error("No firmware files found in bucket")
			}

			// Filter for firmware files that match the format "[VERSION].bin"
			const firmwareFiles = listedObjects.Contents
				.filter(item => {
					const key = item.Key || ""
					// This regex matches a pattern like "10.bin" - just numbers followed by .bin
					return /^\d+\.bin$/.test(key)
				})
				.map(item => {
					const key = item.Key as string
					// Extract version number by removing .bin
					const version = parseInt(key.replace(".bin", ""), 10)
					return {
						key: key,
						version: isNaN(version) ? 0 : version,
					}
				})
				.sort((a, b) => b.version - a.version) // Sort descending (newest first)

			if (isEmpty(firmwareFiles)) {
				throw new Error("No valid firmware files found in bucket")
			}

			// Get the latest firmware file
			const latestFirmware = firmwareFiles[0]
			console.info(`Found latest firmware: version ${latestFirmware.version}, key: ${latestFirmware.key}`)

			return {
				version: latestFirmware.version,
				key: latestFirmware.key
			}
		} catch (error) {
			console.error("Error retrieving firmware metadata from S3:", error)
			throw error
		}
	}

	private async getFirmwareBinary(key: string): Promise<Buffer> {
		try {
			const firmwareBucket = await SecretsManager.getInstance().getSecret("FIRMWARE_S3_BUCKET")

			const getCommand = new GetObjectCommand({
				Bucket: firmwareBucket,
				Key: key,
			})

			const response = await this.s3.send(getCommand)

			if (!response.Body) {
				throw new Error("Empty response body from S3")
			}

			// Convert the readable stream to a buffer
			return this.streamToBuffer(response.Body as Readable)
		} catch (error) {
			console.error(`Error retrieving firmware binary for key ${key}:`, error)
			throw error
		}
	}

	public async retrieveLatestFirmwareWithMetadata(): Promise<FirmwareData> {
		try {
			const { version, key } = await this.getLatestFirmwareVersion()

			const firmwareBuffer = await this.getFirmwareBinary(key)

			// Return combined result
			return {
				firmwareVersion: version,
				firmwareBuffer
			}
		} catch (error) {
			console.error("Error retrieving complete firmware data:", error)
			throw error
		}
	}

	private streamToBuffer(stream: Readable): Promise<Buffer> {
		return new Promise<Buffer>((resolve, reject) => {
			const chunks: Buffer[] = []
			stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
			stream.on("error", reject)
			stream.on("end", () => resolve(Buffer.concat(chunks)))
		})
	}
}
