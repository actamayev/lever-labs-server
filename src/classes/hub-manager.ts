import { StudentViewHubData, TeacherViewHubData } from "@lever-labs/common-ts/types/hub"
import { ClassCode, HubUUID } from "@lever-labs/common-ts/types/utils"
import SingletonWithRedis from "./singletons/singleton-with-redis"

interface Hub extends TeacherViewHubData {
	teacherId: number
}

export default class HubManager extends SingletonWithRedis {

	private constructor() {
		super()
	}

	public static override getInstance(): HubManager {
		if (!HubManager.instance) {
			HubManager.instance = new HubManager()
		}
		return HubManager.instance
	}

	public async createHub(hubId: HubUUID, hub: Hub): Promise<void> {
		const redis = await this.getRedis()
		await redis.set(`hub:${hubId}`, JSON.stringify(hub))
	}

	public async deleteHub(hubId: HubUUID): Promise<void> {
		const redis = await this.getRedis()
		await redis.del(`hub:${hubId}`)
	}

	public async setSlideId(hubId: HubUUID, slideId: string): Promise<void> {
		const redis = await this.getRedis()
		const hubData = await redis.get(`hub:${hubId}`)
		if (!hubData) return

		const hub = JSON.parse(hubData) as Hub
		hub.slideId = slideId
		await redis.set(`hub:${hubId}`, JSON.stringify(hub))
	}

	public async addStudentToHub(hubId: HubUUID, userId: number, username: string): Promise<Hub | null> {
		const redis = await this.getRedis()
		const hubData = await redis.get(`hub:${hubId}`)
		if (!hubData) return null

		const hub = JSON.parse(hubData) as Hub
		hub.studentsJoined.push({ userId, username })
		await redis.set(`hub:${hubId}`, JSON.stringify(hub))
		return hub
	}

	public async removeStudentFromHub(hubId: HubUUID, userId: number): Promise<void> {
		const redis = await this.getRedis()
		const hubData = await redis.get(`hub:${hubId}`)
		if (!hubData) return

		const hub = JSON.parse(hubData) as Hub
		hub.studentsJoined = hub.studentsJoined.filter(student => student.userId !== userId)
		await redis.set(`hub:${hubId}`, JSON.stringify(hub))
	}

	public async removeStudentFromAllHubs(userId: number): Promise<void> {
		const redis = await this.getRedis()
		const keys = await redis.keys("hub:*")

		for (const key of keys) {
			const hubData = await redis.get(key)
			if (!hubData) continue

			const hub = JSON.parse(hubData) as Hub
			hub.studentsJoined = hub.studentsJoined.filter(student => student.userId !== userId)
			await redis.set(key, JSON.stringify(hub))
		}
	}

	public async doesHubBelongToTeacher(hubId: HubUUID, teacherId: number): Promise<boolean> {
		const redis = await this.getRedis()
		const hubData = await redis.get(`hub:${hubId}`)
		if (!hubData) return false

		const hub = JSON.parse(hubData) as Hub
		return hub.teacherId === teacherId
	}

	public async getStudentHubs(classCode: ClassCode): Promise<StudentViewHubData[]> {
		const redis = await this.getRedis()
		const keys = await redis.keys("hub:*")
		const hubs: StudentViewHubData[] = []

		for (const key of keys) {
			const hubData = await redis.get(key)
			if (!hubData) continue

			const hub = JSON.parse(hubData) as Hub
			if (hub.classCode === classCode) {
				hubs.push({
					hubId: hub.hubId,
					classCode: hub.classCode,
					careerUUID: hub.careerUUID,
					slideId: hub.slideId,
					hubName: hub.hubName
				})
			}
		}

		return hubs
	}

	public async getTeacherHubs(teacherId: number): Promise<TeacherViewHubData[]> {
		const redis = await this.getRedis()
		const keys = await redis.keys("hub:*")
		const hubs: TeacherViewHubData[] = []

		for (const key of keys) {
			const hubData = await redis.get(key)
			if (!hubData) continue

			const hub = JSON.parse(hubData) as Hub
			if (hub.teacherId === teacherId) {
				hubs.push({
					hubId: hub.hubId,
					classCode: hub.classCode,
					careerUUID: hub.careerUUID,
					slideId: hub.slideId,
					hubName: hub.hubName,
					studentsJoined: hub.studentsJoined
				})
			}
		}

		return hubs
	}

	public async getClassroomActiveHubs(classCode: ClassCode): Promise<StudentViewHubData[]> {
		const redis = await this.getRedis()
		const keys = await redis.keys("hub:*")
		const hubs: StudentViewHubData[] = []

		for (const key of keys) {
			const hubData = await redis.get(key)
			if (!hubData) continue

			const hub = JSON.parse(hubData) as Hub
			if (hub.classCode === classCode) {
				hubs.push({
					hubId: hub.hubId,
					classCode: hub.classCode,
					careerUUID: hub.careerUUID,
					slideId: hub.slideId,
					hubName: hub.hubName
				})
			}
		}

		return hubs
	}

	public async checkIfStudentInHub(hubId: HubUUID, userId: number): Promise<boolean> {
		const redis = await this.getRedis()
		const hubData = await redis.get(`hub:${hubId}`)
		if (!hubData) return false

		const hub = JSON.parse(hubData) as Hub
		return hub.studentsJoined.some(student => student.userId === userId)
	}

	public async getStudentHubsByUserId(userId: number): Promise<{ hubId: HubUUID, classCode: ClassCode, teacherId: number }[]> {
		const redis = await this.getRedis()
		const keys = await redis.keys("hub:*")
		const studentHubs: { hubId: HubUUID, classCode: ClassCode, teacherId: number }[] = []

		for (const key of keys) {
			const hubData = await redis.get(key)
			if (!hubData) continue

			const hub = JSON.parse(hubData) as Hub
			if (hub.studentsJoined.some(student => student.userId === userId)) {
				studentHubs.push({
					hubId: hub.hubId,
					classCode: hub.classCode,
					teacherId: hub.teacherId
				})
			}
		}

		return studentHubs
	}

	public async getStudentIdsByHubId(hubId: HubUUID): Promise<number[]> {
		const redis = await this.getRedis()
		const hubData = await redis.get(`hub:${hubId}`)
		if (!hubData) return []

		const hub = JSON.parse(hubData) as Hub
		return hub.studentsJoined.map(student => student.userId)
	}
}
