import { MessageSender } from "@prisma/client"
import { BlocklyJson } from "@actamayev/lever-labs-common-ts/types/sandbox"
import { SandboxProjectUUID } from "@actamayev/lever-labs-common-ts/types/utils"

declare global {
	interface RetrievedSandboxData {
		sandbox_json: BlocklyJson
		project_uuid: SandboxProjectUUID
		is_starred: boolean
		project_name: string | null
		created_at: Date
		updated_at: Date
		project_notes: string | null
		project_owner_id: number
		user: {
			username: string | null
			name: string | null
			profile_picture: {
				image_url: string
			} | null
		}
		sandbox_chat: {
			messages: {
				message_text: string
				sender: MessageSender
				created_at: Date
			}[]
		} | null
		sandbox_project_shares?: {
			user: {
				user_id: number
				username: string | null
				name: string | null
				profile_picture: {
					image_url: string
				} | null
			}
		}[]
	}

	interface RetrievedUserSearchResult {
		user_id: number
		username: string | null
		name: string | null
		profile_picture: {
			image_url: string
		} | null
	}
}

export {}
