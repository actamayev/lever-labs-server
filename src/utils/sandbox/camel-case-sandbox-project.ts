import { ProjectUUID, SandboxProject } from "@bluedotrobots/common-ts"
import { sandbox_project } from "@prisma/client"

export default function camelCaseSandboxProject(sandboxProject: sandbox_project): SandboxProject {
	try {
		return {
			sandboxXml: sandboxProject.sandbox_xml,
			projectUUID: sandboxProject.project_uuid as ProjectUUID,
			isStarred: sandboxProject.is_starred,
			projectName: sandboxProject.project_name,
			createdAt: sandboxProject.created_at,
			updatedAt: sandboxProject.updated_at,
			projectNotes: sandboxProject.project_notes
		}
	} catch (error) {
		console.error(error)
		throw error
	}
}
