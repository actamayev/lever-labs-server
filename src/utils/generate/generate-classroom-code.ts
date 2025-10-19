import { ClassCode } from "@lever-labs/common-ts/types/utils"
import { ACCEPTABLE_CLASS_CODE_CHARACTERS } from "@lever-labs/common-ts/types/utils/constants"

export default function generateClassroomCode(): ClassCode {
	try {
		const characters = ACCEPTABLE_CLASS_CODE_CHARACTERS
		let result = ""
		for (let i = 0; i < 5; i++) {
			const randomIndex = Math.floor(Math.random() * characters.length)
			result += characters[randomIndex]
		}
		return result as ClassCode
	} catch (error) {
		console.error(error)
		throw error
	}
}
