import { spawn } from "node:child_process";

interface Step {
	name: string;
	command: string;
	args: string[];
	required: boolean;
}

const runStep = (step: Step): Promise<void> => {
	return new Promise((resolve, reject) => {
		console.log(`\n▶ ${step.name}`);
		const proc = spawn(step.command, step.args, {
			stdio: "inherit",
			shell: false,
			env: process.env,
		});

		proc.on("exit", (code) => {
			if (code === 0) {
				console.log(`✅ ${step.name}`);
				resolve();
				return;
			}

			const msg = `Step failed (${step.name}) with exit code ${code ?? "unknown"}`;
			if (step.required) {
				reject(new Error(msg));
				return;
			}
			console.warn(`⚠️ ${msg}`);
			resolve();
		});

		proc.on("error", reject);
	});
};

async function main() {
	const withApiSmoke = process.argv.includes("--with-api-smoke");

	const baseSteps: Step[] = [
		{ name: "Backend lint", command: "pnpm", args: ["lint"], required: true },
		{ name: "Backend build", command: "pnpm", args: ["build"], required: true },
	];

	const apiSmokeSteps: Step[] = [
		{ name: "Auth smoke", command: "pnpm", args: ["tsx", "scripts/test-auth.ts"], required: true },
		{ name: "Chat smoke", command: "pnpm", args: ["tsx", "scripts/test-chat.ts"], required: false },
		{ name: "Health smoke", command: "pnpm", args: ["tsx", "scripts/test-health.ts"], required: false },
		{ name: "Profile smoke", command: "pnpm", args: ["tsx", "scripts/test-profile-api.ts"], required: false },
		{ name: "Reports smoke", command: "pnpm", args: ["tsx", "scripts/test-report-generation.ts"], required: false },
	];

	const steps = withApiSmoke ? [...baseSteps, ...apiSmokeSteps] : baseSteps;

	console.log("\n=== Validation Matrix Runner ===");
	console.log(`Mode: ${withApiSmoke ? "full (with API smoke)" : "quick (lint/build only)"}`);
	if (withApiSmoke) {
		console.log("Expected: local backend server should already be running and reachable via API_URL.");
	}

	for (const step of steps) {
		await runStep(step);
	}

	console.log("\n🎉 Validation matrix completed successfully.");
}

main().catch((error) => {
	console.error("\n❌ Validation matrix failed:", error instanceof Error ? error.message : error);
	process.exit(1);
});
