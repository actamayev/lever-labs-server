import { Response, Request } from "express"
import { ErrorResponse } from "@lever-labs/common-ts/types/api"

export default function stringifyBlocklyJson(req: Request, res: Response): void {
	try {
		const blocklyJson = req.body
		const jsonString = JSON.stringify(blocklyJson)

		// Escape double quotes for CSV by doubling them
		const csvEscaped = jsonString.replace(/"/g, "\"\"")

		// Return as plain text so you can copy it directly
		res.status(200).type("text/plain").send(`"${csvEscaped}"`)
		return
	} catch (error) {
		console.error(error)
		res.status(500).json({ error: "Internal Server Error: Unable to stringify blockly json" } satisfies ErrorResponse)
		return
	}
}
