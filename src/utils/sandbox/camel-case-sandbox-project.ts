import { SandboxChatMessage } from "@lever-labs/common-ts/types/chat"
import { SandboxProject, SharedWith } from "@lever-labs/common-ts/types/sandbox"

export default function camelCaseSandboxProject(
	sandboxProject: RetrievedSandboxData,
	userId: number
): SandboxProject {
	try {
		const sandboxChatMessages: SandboxChatMessage[] = sandboxProject.sandbox_chat?.messages.map(msg => ({
			role: msg.sender === "USER" ? "user" : "assistant",
			content: msg.message_text,
			timestamp: new Date(msg.created_at)
		}) satisfies SandboxChatMessage) || []

		const isMyProject = sandboxProject.project_owner_id === userId

		const sharedWith: SharedWith[] =
			sandboxProject.sandbox_project_shares
				?.filter(share => share.user.username !== null)
				.map(share => ({
					userId: share.user.user_id,
					username: share.user.username as string
				})) || []

		return {
			sandboxJson: sandboxProject.sandbox_json,
			sandboxProjectUUID: sandboxProject.project_uuid,
			isStarred: sandboxProject.is_starred,
			projectName: sandboxProject.project_name,
			createdAt: new Date(sandboxProject.created_at),
			updatedAt: new Date(sandboxProject.updated_at),
			projectNotes: sandboxProject.project_notes,
			sandboxChatMessages,
			isMyProject,
			sharedWith
		}
	} catch (error) {
		console.error(error)
		throw error
	}
}
