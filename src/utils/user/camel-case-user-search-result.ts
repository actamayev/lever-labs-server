import { SingleSearchByUsernameResult } from "@lever-labs/common-ts/types/sandbox"

export default function camelCaseUserSearchResult(user: RetrievedUserSearchResult): SingleSearchByUsernameResult {
	try {
		return {
			userId: user.user_id,
			username: user.username as string,
			name: user.name,
			profilePictureUrl: user.profile_picture?.image_url || null
		}
	} catch (error) {
		console.error(error)
		throw error
	}
}

