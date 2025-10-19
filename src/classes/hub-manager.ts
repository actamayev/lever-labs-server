import { StudentViewHubData, TeacherViewHubData } from "@lever-labs/common-ts/types/hub"
import { ClassCode, HubUUID } from "@lever-labs/common-ts/types/utils"
import Singleton from "./singleton"
import MongoClientClass from "./mongo-client-class"
import { HubModel, Hub } from "../models/Hub.model"

export default class HubManager extends Singleton {
	private constructor() {
		super()
	}

	public static override async getInstance(): Promise<HubManager> {
		if (!HubManager.instance) {
			// Ensure MongoDB is connected
			await MongoClientClass.connect()
			HubManager.instance = new HubManager()
		}
		return HubManager.instance as HubManager
	}

	public async createHub(hubId: HubUUID, hubData: Omit<Hub, "hubId">): Promise<void> {
		await HubModel.create({
			hubId,
			...hubData,
		})
	}

	public async deleteHub(hubId: HubUUID): Promise<void> {
		await HubModel.deleteOne({ hubId })
	}

	public async setSlideId(hubId: HubUUID, slideId: string): Promise<void> {
		await HubModel.updateOne(
			{ hubId },
			{ $set: { slideId } }
		)
	}

	public async addStudentToHub(hubId: HubUUID, userId: number, username: string): Promise<Hub | null> {
		// Use $addToSet to prevent duplicates (atomic operation)
		const result = await HubModel.findOneAndUpdate(
			{ hubId },
			{
				$addToSet: {
					studentsJoined: { userId, username }
				}
			},
			{ new: true } // Return updated document
		)

		return result
	}

	public async removeStudentFromHub(hubId: HubUUID, userId: number): Promise<void> {
		await HubModel.updateOne(
			{ hubId },
			{ $pull: { studentsJoined: { userId } } }
		)
	}

	public async removeStudentFromAllHubs(userId: number): Promise<void> {
		// Remove student from all hubs in one operation
		await HubModel.updateMany(
			{ "studentsJoined.userId": userId },
			{ $pull: { studentsJoined: { userId } } }
		)
	}

	public async doesHubBelongToTeacher(hubId: HubUUID, teacherId: number): Promise<boolean> {
		const hub = await HubModel.findOne({ hubId, teacherId })
		return hub !== null
	}

	public async getStudentHubs(classCode: ClassCode): Promise<StudentViewHubData[]> {
		const hubs = await HubModel.find(
			{ classCode },
			{ hubId: 1, classCode: 1, careerUUID: 1, slideId: 1, hubName: 1, _id: 0 }
		).lean()

		// Cast to correct type - Mongoose doesn't know about branded types
		return hubs as unknown as StudentViewHubData[]
	}

	public async getTeacherHubs(teacherId: number): Promise<TeacherViewHubData[]> {
		const hubs = await HubModel.find(
			{ teacherId },
			{ hubId: 1, classCode: 1, careerUUID: 1, slideId: 1, hubName: 1, studentsJoined: 1, _id: 0 }
		).lean()

		// Cast to correct type - Mongoose doesn't know about branded types
		return hubs as unknown as TeacherViewHubData[]
	}

	public async getClassroomActiveHubs(classCode: ClassCode): Promise<StudentViewHubData[]> {
		const hubs = await HubModel.find(
			{ classCode },
			{ hubId: 1, classCode: 1, careerUUID: 1, slideId: 1, hubName: 1, _id: 0 }
		).lean()

		// Cast to correct type - Mongoose doesn't know about branded types
		return hubs as unknown as StudentViewHubData[]
	}

	public async checkIfStudentInHub(hubId: HubUUID, userId: number): Promise<boolean> {
		const hub = await HubModel.findOne({
			hubId,
			"studentsJoined.userId": userId
		})

		return hub !== null
	}

	public async getStudentHubsByUserId(userId: number): Promise<{ hubId: HubUUID, classCode: ClassCode, teacherId: number }[]> {
		const hubs = await HubModel.find(
			{ "studentsJoined.userId": userId },
			{ hubId: 1, classCode: 1, teacherId: 1, _id: 0 }
		).lean()

		return hubs
	}

	public async getStudentIdsByHubId(hubId: HubUUID): Promise<number[]> {
		const hub = await HubModel.findOne(
			{ hubId },
			{ studentsJoined: 1, _id: 0 }
		).lean()

		if (!hub) return []

		return hub.studentsJoined.map(student => student.userId)
	}
}
