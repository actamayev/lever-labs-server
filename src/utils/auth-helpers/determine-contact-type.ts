import validator from "validator"

export default function determineLoginContactType(input: string): EmailOrUsername {
	try {
		if (validator.isEmail(input)) return "Email"

		return "Username"
	} catch (error) {
		console.error(error)
		throw error
	}
}
