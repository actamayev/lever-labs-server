import { UUID } from "crypto"
import { ClassCode, CareerUUID } from "@bluedotrobots/common-ts"
import Singleton from "./singleton"

interface Hub {
	teacherId: number
	hubName: string
	classCode: ClassCode
	careerUUID: CareerUUID
	slideId: string
	studentsJoined: string[] // usernames
}

export default class HubManager extends Singleton {
	private hubs: Map<UUID, Hub> = new Map()

	private constructor() {
		super()
	}

	public static override getInstance(): HubManager {
		if (!HubManager.instance) {
			HubManager.instance = new HubManager()
		}
		return HubManager.instance
	}

	public createHub(hubId: UUID, hub: Hub): void {
		this.hubs.set(hubId, hub)
	}
}
