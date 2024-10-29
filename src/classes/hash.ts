import { hash, compare } from "bcrypt"

export default class Hash {
	public static async hashCredentials(unhashedData: string): Promise<HashedString> {
		try {
			const saltRounds = 10
			return await hash(unhashedData, saltRounds) as HashedString
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	public static async checkPassword(plaintextPassword: string, hashedPassword: HashedString): Promise<boolean> {
		try {
			return await compare(plaintextPassword, hashedPassword)
		} catch (error) {
			console.error(error)
			throw error
		}
	}
}
