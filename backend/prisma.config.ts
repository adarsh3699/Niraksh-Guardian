import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
		seed: "tsx prisma/seed.ts",
	},
	datasource: {
		// Keep generate working even when DATABASE_URL is not set (e.g. CI type-check jobs).
		url: process.env.DATABASE_URL ?? "",
	},
});
