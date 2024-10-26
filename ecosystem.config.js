module.exports = {
	apps : [{
		name: "blue-dot-robots-server",
		script: "./index.js", // Your main application file
		instances: "max", // Number of instances to run
		autorestart: true, // Automatically restart the app if it crashes
		watch: false, // Watch for file changes and reload the app (useful in development)
		env: {
			NODE_ENV: "development" // Default environment variables
		},
		env_dev_production: {
			NODE_ENV: "production-dev", // Retrieves Secrets for production dev
		},
		env_prod_production: {
			NODE_ENV: "production-prod", // Retrieves Secrets for production prod
		}
	}]
}
