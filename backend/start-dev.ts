import { RedisMemoryServer } from "redis-memory-server";
import { spawn } from "child_process";
import path from "path";

async function start() {
	const redisServer = new RedisMemoryServer();
	const host = await redisServer.getHost();
	const port = await redisServer.getPort();
	const redisUrl = `redis://${host}:${port}`;

	console.log(`✅ In-memory Redis started at ${redisUrl}`);

	process.env.REDIS_URL = redisUrl;

	// Spawn the main server process
	const serverPath = path.join(__dirname, "src/server.ts");
	const child = spawn("npx", ["ts-node", serverPath], {
		env: { ...process.env, REDIS_URL: redisUrl },
		stdio: "inherit",
	});

	child.on("close", (code) => {
		console.log(`Server process exited with code ${code}`);
		redisServer.stop();
		process.exit(code || 0);
	});

	process.on("SIGINT", async () => {
		console.log("Stopping...");
		child.kill("SIGINT");
		await redisServer.stop();
		process.exit(0);
	});
}

start();
