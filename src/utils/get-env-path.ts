export default function getEnvPath (): string {
	const env = process.env.NODE_ENV

	if (env === "production-dev") {
		return ".env.dev.production"
	}

	if (env === "production-prod") {
		return ".env.prod.production"
	}

	return ".env.local"
}
