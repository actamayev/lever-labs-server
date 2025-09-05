import { UUID } from "crypto"
import { ClassCode, StudentViewHubData, TeacherViewHubData } from "@bluedotrobots/common-ts"
import Singleton from "./singleton"

interface Hub extends TeacherViewHubData {
	teacherId: number
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

	public deleteHub(hubId: UUID): void {
		this.hubs.delete(hubId)
	}

	public setSlideId(hubId: UUID, slideId: string): void {
		const hub = this.hubs.get(hubId)
		if (!hub) return
		hub.slideId = slideId
	}

	public addStudentToHub(hubId: UUID, userId: number, username: string): Hub | null {
		const hub = this.hubs.get(hubId)
		if (!hub) return null
		hub.studentsJoined.push({ userId, username })
		return hub
	}

	public removeStudentFromHub(hubId: UUID, userId: number): void {
		const hub = this.hubs.get(hubId)
		if (!hub) return
		hub.studentsJoined = hub.studentsJoined.filter(student => student.userId !== userId)
	}

	public removeStudentFromAllHubs(userId: number): void {
		this.hubs.forEach(hub => {
			hub.studentsJoined = hub.studentsJoined.filter(student => student.userId !== userId)
		})
	}

	public doesHubBelongToTeacher(hubId: UUID, teacherId: number): boolean {
		const hub = this.hubs.get(hubId)
		if (!hub) return false
		return hub.teacherId === teacherId
	}

	public getStudentHubs(classCode: ClassCode): StudentViewHubData[] {
		return Array.from(this.hubs.values()).filter(hub => hub.classCode === classCode).map(hub => ({
			hubId: hub.hubId,
			classCode: hub.classCode,
			careerUUID: hub.careerUUID,
			slideId: hub.slideId,
			hubName: hub.hubName
		}))
	}

	public getTeacherHubs(teacherId: number): TeacherViewHubData[] {
		return Array.from(this.hubs.values()).filter(hub => hub.teacherId === teacherId).map(hub => ({
			hubId: hub.hubId,
			classCode: hub.classCode,
			careerUUID: hub.careerUUID,
			slideId: hub.slideId,
			hubName: hub.hubName,
			studentsJoined: hub.studentsJoined
		}))
	}

	public getClassroomActiveHubs(classCode: ClassCode): StudentViewHubData[] {
		return Array.from(this.hubs.values()).filter(hub => hub.classCode === classCode).map(hub => ({
			hubId: hub.hubId,
			classCode: hub.classCode,
			careerUUID: hub.careerUUID,
			slideId: hub.slideId,
			hubName: hub.hubName
		}))
	}

	public checkIfStudentInHub(hubId: UUID, userId: number): boolean {
		const hub = this.hubs.get(hubId)
		if (!hub) return false
		return hub.studentsJoined.some(student => student.userId === userId)
	}

	public getStudentHubsByUserId(userId: number): { hubId: UUID, classCode: ClassCode, teacherId: number }[] {
		return Array.from(this.hubs.values()).filter(hub => hub.studentsJoined.some(student => student.userId === userId)).map(hub => ({
			hubId: hub.hubId,
			classCode: hub.classCode,
			teacherId: hub.teacherId
		}))
	}

	public getTeacherIdsByStudentUserId(userId: number): number[] {
		// eslint-disable-next-line max-len
		return Array.from(this.hubs.values()).filter(hub => hub.studentsJoined.some(student => student.userId === userId)).map(hub => hub.teacherId)
	}

	public getTeacherHubsByUserId(userId: number): { hubId: UUID, classCode: ClassCode, studentUserIds: number[] }[] {
		return Array.from(this.hubs.values()).filter(hub => hub.teacherId === userId).map(hub => ({
			hubId: hub.hubId,
			classCode: hub.classCode,
			studentUserIds: hub.studentsJoined.map(student => student.userId)
		}))
	}

}
