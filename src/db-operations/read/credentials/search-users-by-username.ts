import PrismaClientClass from "../../../classes/prisma-client"
import camelCaseUserSearchResult from "../../../utils/user/camel-case-user-search-result"
import { SingleSearchByUsernameResult } from "@lever-labs/common-ts/types/sandbox"

export default async function searchUsersByUsername(searchString: string, userId: number): Promise<SingleSearchByUsernameResult[]> {
	try {
		const prismaClient = await PrismaClientClass.getPrismaClient()

		const users = await prismaClient.credentials.findMany({
			where: {
				username: {
					contains: searchString,
					mode: "insensitive"
				},
				is_active: true,
				user_id: {
					not: userId
				}
			},
			select: {
				user_id: true,
				username: true,
				name: true,
				profile_picture: {
					select: {
						image_url: true
					},
					where: {
						is_active: true
					}
				}
			},
			take: 50 // Limit results to prevent abuse
		})

		const filteredUsers = users.filter(user => user.username !== null) as RetrievedUserSearchResult[]

		return filteredUsers.map(user => camelCaseUserSearchResult(user))
	} catch (error) {
		console.error(error)
		throw error
	}
}

