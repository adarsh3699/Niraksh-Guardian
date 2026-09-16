import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
		seed: "tsx prisma/seed.ts",
	},
	datasource: {
		// Prisma Migrate needs a direct PostgreSQL URL; the app may use an Accelerate URL.
		// Keep generate working even when neither URL is set (e.g. CI type-check jobs).
		url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
	},
});
