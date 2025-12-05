export default function getEnvPath (): string {
	const env = process.env.NODE_ENV

	if (env === "production") {
		return ".env.production"
	}

	return ".env.local"
}
