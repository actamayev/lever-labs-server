import { ClassCode } from "@bluedotrobots/common-ts"

export default function generateClassroomCode(): ClassCode {
	try {
		const characters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
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
