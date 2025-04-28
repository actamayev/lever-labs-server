export default function allowedOrigins(): string[] {
	if (process.env.NODE_ENV === "production" ) {
		return [
			"https://bluedotrobots.com", "https://www.bluedotrobots.com",
			// "wss://production-api.bluedotrobots.com"
		]
	} else if (process.env.NODE_ENV === "staging") {
		return [
			"https://staging.bluedotrobots.com",
			// "wss://staging-api.bluedotrobots.com"
		]
	} else {
		return [
			"http://localhost:3000",
			"http://localhost:3001",
			// "ws://localhost:8080"
		]
	}
}
