import isNull from "lodash/isNull"
import PrismaClientClass from "../../../classes/prisma-client"
import { validateExtendedCredentials } from "../../../utils/type-helpers/type-guards"

// eslint-disable-next-line max-lines-per-function
export async function findUserById(userId: number): Promise<ExtendedCredentials | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const user = await prismaClient.credentials.findUnique({
			where: {
				user_id: userId,
				is_active: true
			},
			select: {
				user_id: true,
				username: true,
				age: true,
				password: true,
				is_active: true,
				default_site_theme: true,
				sandbox_notes_open: true,
				auth_method: true,
				email__encrypted: true,
				name: true,
				created_at: true,
				updated_at: true,
				profile_picture: {
					select: {
						image_url: true
					},
					where: {
						is_active: true
					}
				},
				teacher: {
					select: {
						teacher_first_name: true,
						teacher_last_name: true,
						school: {
							select: {
								school_name: true
							}
						},
						is_approved: true
					}
				}
			}
		})

		if (isNull(user) || validateExtendedCredentials(user) === false) return null

		return user
	} catch (error) {
		console.error("Error finding user by Id:", error)
		throw error
	}
}

// eslint-disable-next-line max-lines-per-function
export async function findUserByWhereCondition(
	whereCondition:
		{ username?: { equals: string, mode: "insensitive" } } |
		{ email__encrypted?: { equals: DeterministicEncryptedString } }
): Promise<ExtendedCredentials | null> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const user = await prismaClient.credentials.findFirst({
			where: {
				...whereCondition,
				is_active: true,
			},
			select: {
				user_id: true,
				username: true,
				age: true,
				password: true,
				is_active: true,
				default_site_theme: true,
				sandbox_notes_open: true,
				auth_method: true,
				email__encrypted: true,
				name: true,
				created_at: true,
				updated_at: true,
				profile_picture: {
					select: {
						image_url: true
					},
					where: {
						is_active: true
					}
				},
				teacher: {
					select: {
						teacher_first_name: true,
						teacher_last_name: true,
						school: {
							select: {
								school_name: true
							}
						},
						is_approved: true
					}
				}
			}
		})

		if (isNull(user) || validateExtendedCredentials(user) === false) return null

		return user
	} catch (error) {
		console.error("Error finding user:", error)
		throw error
	}
}
