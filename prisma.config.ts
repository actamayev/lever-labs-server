import { config } from "dotenv"
import { defineConfig } from "prisma/config"

// Load .env.local for development
config({ path: ".env.local" })

export default defineConfig({
	migrations: {
		seed: "ts-node --files src/prisma/seed.ts",
	},
})
