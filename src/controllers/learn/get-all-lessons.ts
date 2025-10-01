import { Response, Request } from "express"
import { ErrorResponse } from "@lever-labs/common-ts/types/api"
import getAllLessonsDb from "../../db-operations/read/lesson/get-all-lessons-db"

export default async function getAllLessons(req: Request, res: Response): Promise<void> {
	try {
		const { userId } = req
		const lessons = await getAllLessonsDb(userId)

		res.status(200).json({ lessons } satisfies LessonsResponse)
		return
	} catch (error: unknown) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to retrieve lessons" } satisfies ErrorResponse)
		return
	}
}
