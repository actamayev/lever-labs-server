import { AuthMethods, SiteThemes } from "@prisma/client"

declare global {
	interface LoginInformation {
		contact: string
		password: string
	}

	interface RegisterInformation {
		email: string
		username: string
		siteTheme: SiteThemes
		password: string
	}

	interface NewLocalUserFields {
		username: string
		password: HashedString
		auth_method: AuthMethods
		default_site_theme: SiteThemes
		email__encrypted: DeterministicEncryptedString
	}

	type DeterministicEncryptedString = string & { __type: "DeterministicEncryptedString" }
	type NonDeterministicEncryptedString = string & { __type: "NonDeterministicEncryptedString" }

	type HashedString = string & { __hashed: true }
}

export {}
