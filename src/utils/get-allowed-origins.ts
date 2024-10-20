export default function allowedOrigins(): string[] {
	if (process.env.NODE_ENV === "production-dev" || process.env.NODE_ENV === "production-prod" ) {
		return [ "https://bluedotrobots.com", "ws://dev-api.bluedotrobots.com" ]
	} else {
		return [ "http://localhost:3000", "ws://localhost:3000" ]
	}
}
