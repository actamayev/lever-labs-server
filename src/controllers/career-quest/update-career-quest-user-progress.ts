import { Request, Response } from "express"
import { ErrorResponse, SuccessResponse } from "@bluedotrobots/common-ts"
import updateCareerQuestUserProgressDB from "../../db-operations/write/career-quest-user-progress/update-career-quest-user-progress"

export default async function updateCareerQuestUserProgress(req: Request, res: Response): Promise<void> {
	try {
		const { userId, careerId } = req
		const { currentId } = req.body

		await updateCareerQuestUserProgressDB(userId, careerId, currentId)
		res.status(200).json({ success: "Career quest user progress updated" } satisfies SuccessResponse)
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to update career quest user progress" } satisfies ErrorResponse)
		return
	}
}
