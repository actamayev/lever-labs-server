declare global {
	type ProjectUUID = `${string}-${string}-${string}-${string}-${string}`

	interface SandboxProject {
		sandboxXml: string
		projectUUID: ProjectUUID
		isStarred: boolean
		projectName: string | null
		createdAt: Date
		updatedAt: Date
		notes: string | null
	}
}

export {}
