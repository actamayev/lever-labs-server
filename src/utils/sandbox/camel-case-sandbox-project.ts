import { ChatMessage, ProjectUUID, SandboxProject } from "@bluedotrobots/common-ts"

export default function camelCaseSandboxProject(sandboxProject: RetrievedSandboxData): SandboxProject {
	try {
		const messages: ChatMessage[] = sandboxProject.sandbox_chat?.messages.map(msg => ({
			role: msg.sender === "USER" ? "user" : "assistant",
			content: msg.message_text,
			timestamp: msg.created_at
		})) || []

		return {
			sandboxJson: JSON.parse(sandboxProject.sandbox_json),
			projectUUID: sandboxProject.project_uuid as ProjectUUID,
			isStarred: sandboxProject.is_starred,
			projectName: sandboxProject.project_name,
			createdAt: sandboxProject.created_at,
			updatedAt: sandboxProject.updated_at,
			projectNotes: sandboxProject.project_notes,
			sandboxChatMessages: messages
		}
	} catch (error) {
		console.error(error)
		throw error
	}
}
