import { isNull, isUndefined } from "lodash"
import Singleton from "../singleton"
import AwsS3 from "../aws/s3-manager"

export default class EspLatestFirmwareManager extends Singleton {
	public latestFirmwareVersion: number = 0
	public latestBinary: Buffer | null = null

	private constructor() {
		super()
		void this.retrieveLatestFirmwareInfo()
	}

	public static override getInstance(): EspLatestFirmwareManager {
		if (isNull(EspLatestFirmwareManager.instance)) {
			EspLatestFirmwareManager.instance = new EspLatestFirmwareManager()
		}
		return EspLatestFirmwareManager.instance
	}

	public async retrieveLatestFirmwareInfo(): Promise<void> {
		try {
			if (isUndefined(process.env.NODE_ENV)) return // Means the env is local
			const firmwareData = await AwsS3.getInstance().retrieveLatestFirmwareWithMetadata()
			this.latestFirmwareVersion = Number(firmwareData.firmwareVersion)
			this.latestBinary = firmwareData.firmwareBuffer
			console.info(`Retrieved latest binary version: ${this.latestFirmwareVersion}`)
		} catch (error) {
			console.error(error)
		}
	}

	public async getLatestFirmwareInfo(): Promise<Buffer> {
		try {
			if (isNull(this.latestBinary)) {
				await this.retrieveLatestFirmwareInfo()
			}
			if (isNull(this.latestBinary)) {
				throw Error("Unable to retrieve latest firmware")
			}
			return this.latestBinary
		} catch (error) {
			console.error(error)
			throw error
		}
	}
}
