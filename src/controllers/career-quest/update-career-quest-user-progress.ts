import { Request, Response } from "express"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts"
import updateCareerUserProgress from "../../db-operations/write/career-user-progress/update-career-user-progress"

export default async function updateCareerQuestUserProgress(req: Request, res: Response): Promise<void> {
	try {
		const { userId, careerId } = req
		const { currentId, isFurthestSeen } = req.body

		await updateCareerUserProgress(userId, careerId, currentId, isFurthestSeen)
		res.status(200).json({ success: "Career quest user progress updated" } satisfies SuccessResponse)
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to update career quest user progress" } satisfies ErrorResponse)
		return
	}
}
