import { PipUUID } from "@actamayev/lever-labs-common-ts/types/utils"
import { ACCEPTABLE_PIP_ID_CHARACTERS } from "@actamayev/lever-labs-common-ts/types/utils/constants"

export default function generatePipUUID(): PipUUID {
	try {
		const characters = ACCEPTABLE_PIP_ID_CHARACTERS
		let result = ""
		for (let i = 0; i < 5; i++) {
			const randomIndex = Math.floor(Math.random() * characters.length)
			result += characters[randomIndex]
		}
		return result as PipUUID
	} catch (error) {
		console.error(error)
		throw error
	}
}
