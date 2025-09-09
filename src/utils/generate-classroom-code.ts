import { ClassCode } from "@bluedotrobots/common-ts/types/utils"

export default function generateClassroomCode(): ClassCode {
	try {
		const characters = "abcdefghijkmnpqrstuvwxyz23456789"
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
