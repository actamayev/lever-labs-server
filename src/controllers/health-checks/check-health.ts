import { Request, Response } from "express"

export default function checkHealth(req: Request, res: Response): void {
	res.status(200).send("OK")
}
