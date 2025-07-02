import { MessageSender } from "@prisma/client"

declare global {
	interface RetrievedSandboxData {
		sandbox_json: string
		project_uuid: string
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
