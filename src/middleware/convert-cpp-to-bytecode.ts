import { Request, Response, NextFunction } from "express"
import CppParser from "../classes/cpp-parser"

export default function convertCppToBytecode(req: Request, res: Response, next: NextFunction): void {
	try {
		const { cppCode } = req.body as { cppCode: string }

		if (!cppCode) {
			res.status(400).json({ error: "No C++ code provided" })
			return
		}
		const bytecode = CppParser.cppToByte(cppCode)

		req.body.bytecode = bytecode
		next()
	} catch (error) {
		console.error("C++ to bytecode conversion error:", error)
		res.status(500).json({ error: "Internal Server Error: Unable to convert C++ to bytecode" })
		return
	}
}
