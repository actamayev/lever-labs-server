import { Response, Request } from "express"
import compileUserCode from "../../utils/cpp/send-cpp-to-docker"
import Esp32SocketManager from "../../classes/esp32/esp32-socket-manager"

export default async function compileAndSendCppToPip(req: Request, res: Response): Promise<void> {
	const startTime = performance.now()
	let compileStartTime: number
	let emitStartTime: number

	try {
	  const { pipUUID, cppCode } = req.body as { pipUUID: PipUUID, cppCode: string }

	  // Log time for request parsing
	  console.log(`Request parsing took ${performance.now() - startTime}ms`)

	  // Start compile timing
	  compileStartTime = performance.now()
	  const compiledUserCode = await compileUserCode(cppCode, pipUUID)
	  console.log(`Compilation took ${performance.now() - compileStartTime}ms`)

	  // Start emit timing
	  emitStartTime = performance.now()
	  await Esp32SocketManager.getInstance().emitBinaryCodeToPip(pipUUID, compiledUserCode)
	  console.log(`Emitting code took ${performance.now() - emitStartTime}ms`)

	  // Log total time
	  console.log(`Total operation took ${performance.now() - startTime}ms`)

	  res.status(200).json({ success: "Sent code to Pip" })
	  return
	} catch (error) {
	  // Log time until error
	  console.error(`Operation failed after ${performance.now() - startTime}ms`)
	  console.error(error)
	  res.status(500).json({ error: "Internal Server Error: Unable to compile and send Pip the code" })
	  return
	}
}
