import { Request, Response } from "express"

export default function checkHealth(_req: Request, res: Response): void {
	res.status(200).send("OK")
	return
}
