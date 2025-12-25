import { SandboxChatMessage } from "@actamayev/lever-labs-common-ts/types/chat"
import { SandboxProject, SingleSearchByUsernameResult } from "@actamayev/lever-labs-common-ts/types/sandbox"

// eslint-disable-next-line max-lines-per-function
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

		const sharedWith: SingleSearchByUsernameResult[] =
			sandboxProject.sandbox_project_shares
				?.filter(share => share.user.username !== null)
				.map(share => ({
					userId: share.user.user_id,
					username: share.user.username as string,
					name: share.user.name,
					profilePictureUrl: share.user.profile_picture?.image_url || null
				})) || []

		const ownerDetails =  {
			username: sandboxProject.user.username as string,
			name: sandboxProject.user.name,
			profilePictureUrl: sandboxProject.user.profile_picture?.image_url || null
		}

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
			sharedWith,
			ownerDetails
		}
	} catch (error) {
		console.error(error)
		throw error
	}
}
