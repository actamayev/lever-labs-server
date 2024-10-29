module.exports = {
	apps : [{
		name: "blue-dot-robots-server",
		script: "./index.js", // Your main application file
		instances: "max", // Number of instances to run
		autorestart: true, // Automatically restart the app if it crashes
		watch: false, // Watch for file changes and reload the app (useful in development)
		env: {
			NODE_ENV: "local" // Default environment variables
		},
		env_staging: {
			NODE_ENV: "staging", // Retrieves Secrets for staging
		},
		env_production: {
			NODE_ENV: "production", // Retrieves Secrets for production
		}
	}]
}
