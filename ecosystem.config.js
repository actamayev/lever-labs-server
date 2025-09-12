module.exports = {
	apps: [
	  {
			name: "blue-dot-robots-server",
			script: "./index.js",
			instances: 1,
			exec_mode: "fork", // 👈 force fork mode
			autorestart: true,
			watch: false,
			max_memory_restart: "400M",
			env: {
		  NODE_ENV: "local",
			},
			env_staging: {
		  NODE_ENV: "staging",
			},
			env_production: {
		  NODE_ENV: "production",
			},
	  },
	],
}
