import { SandboxChatMessage } from "@bluedotrobots/common-ts/types/chat"
import { SandboxProject } from "@bluedotrobots/common-ts/types/sandbox"

export default function camelCaseSandboxProject(sandboxProject: RetrievedSandboxData): SandboxProject {
	try {
		const sandboxChatMessages: SandboxChatMessage[] = sandboxProject.sandbox_chat?.messages.map(msg => ({
			role: msg.sender === "USER" ? "user" : "assistant",
			content: msg.message_text,
			timestamp: new Date(msg.created_at)
		}) satisfies SandboxChatMessage) || []

		return {
			sandboxJson: sandboxProject.sandbox_json,
			sandboxProjectUUID: sandboxProject.project_uuid,
			isStarred: sandboxProject.is_starred,
			projectName: sandboxProject.project_name,
			createdAt: new Date(sandboxProject.created_at),
			updatedAt: new Date(sandboxProject.updated_at),
			projectNotes: sandboxProject.project_notes,
			sandboxChatMessages
		}
	} catch (error) {
		console.error(error)
		throw error
	}
}
