import { MessageSender } from "@prisma/client"
import { BlocklyJson } from "@lever-labs/common-ts/types/sandbox"
import { SandboxProjectUUID } from "@lever-labs/common-ts/types/utils"

declare global {
	interface RetrievedSandboxData {
		sandbox_json: BlocklyJson
		project_uuid: SandboxProjectUUID
		is_starred: boolean
		project_name: string | null
		created_at: Date
		updated_at: Date
		project_notes: string | null
		sandbox_chat: {
			messages: {
				message_text: string
				sender: MessageSender
				created_at: Date
			}[]
		} | null
	}
}

export {}
