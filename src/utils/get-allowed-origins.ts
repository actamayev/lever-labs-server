export default function allowedOrigins(): string[] {
	if (process.env.NODE_ENV === "staging" || process.env.NODE_ENV === "production" ) {
		return [ "https://bluedotrobots.com", "wss://staging-api.bluedotrobots.com" ]
	} else {
		return [ "http://localhost:3000", "ws://localhost:3000" ]
	}
}
