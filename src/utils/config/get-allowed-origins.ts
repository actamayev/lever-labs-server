export default function allowedOrigins(): string[] {
	if (process.env.NODE_ENV === "production") {
		return [
			"https://leverlabs.com",
			"https://www.leverlabs.com"
		]
	} else if (process.env.NODE_ENV === "staging") {
		return [
			"https://staging.leverlabs.com"
		]
	} else {
		return [
			"http://localhost:3000",
			"http://localhost:3001"
		]
	}
}
