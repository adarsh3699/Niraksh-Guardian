/// <reference types="node" />

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";
const EMAIL = process.env.SMOKE_EMAIL ?? "test@example.com";
const PASSWORD = process.env.SMOKE_PASSWORD ?? "password123";

type ApiResult = {
	status: number;
	ok: boolean;
	body: unknown;
};

type StreamEvent =
	| { type: "ack"; userMessage?: { id?: string }; aiMessage?: { id?: string } }
	| { type: "chunk"; delta?: string }
	| { type: "done"; aiMessage?: { id?: string; content?: string } }
	| {
			type: "error";
			error?: string;
			code?: "RESOURCE_EXHAUSTED" | "INTERNAL_STREAM_ERROR" | string;
			retryable?: boolean;
			retryAfterSeconds?: number;
	  };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path: string, init?: RequestInit): Promise<ApiResult> {
	const res = await fetch(`${API_URL}${path}`, init);
	const text = await res.text();
	let body: unknown = text;
	if (text) {
		try {
			body = JSON.parse(text);
		} catch {
			body = text;
		}
	}

	return { status: res.status, ok: res.ok, body };
}

function consumeSseDataLines(chunk: string, onEvent: (event: StreamEvent) => void): string {
	const lines = chunk.split("\n");
	const remainder = lines.pop() ?? "";

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith(":")) continue;
		if (!trimmed.startsWith("data:")) continue;

		const payload = trimmed.slice(5).trim();
		if (!payload) continue;

		try {
			onEvent(JSON.parse(payload) as StreamEvent);
		} catch {
			// Ignore malformed forward-compatible payloads for smoke purposes.
		}
	}

	return remainder;
}

async function waitForServerReadiness() {
	for (let i = 0; i < 20; i += 1) {
		try {
			const res = await fetch(`${API_URL}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
			});
			if (res.status >= 200 && res.status < 500) {
				return;
			}
		} catch {
			// Retry until server responds.
		}
		await wait(300);
	}

	throw new Error("Server did not become ready in time");
}

async function getAccessToken(): Promise<string> {
	let login = await request("/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
	});

	if (!login.ok) {
		await request("/auth/signup", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Smoke User", email: EMAIL, password: PASSWORD }),
		});
		login = await request("/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
		});
	}

	const body = login.body as { accessToken?: string; tokens?: { accessToken?: string } } | null;
	const token = body?.accessToken ?? body?.tokens?.accessToken;
	if (!login.ok || !token) {
		throw new Error(`Auth failed: ${JSON.stringify(login.body)}`);
	}

	return token;
}

async function main() {
	await waitForServerReadiness();
	const token = await getAccessToken();
	const authHeaders = { Authorization: `Bearer ${token}` };

	const chat = await request("/chats", {
		method: "POST",
		headers: { "Content-Type": "application/json", ...authHeaders },
		body: JSON.stringify({ title: `Stream Smoke ${Date.now()}`, language: "en" }),
	});

	const chatBody = chat.body as { id?: string } | null;
	const chatId = chatBody?.id;
	if (!chat.ok || !chatId) {
		throw new Error(`Create chat failed: ${JSON.stringify(chat.body)}`);
	}

	const before = await request(`/chats/${chatId}`, { headers: authHeaders });
	const beforeCount = Array.isArray(before.body) ? before.body.length : -1;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 30_000);

	const streamRes = await fetch(`${API_URL}/chats/${chatId}/messages/stream`, {
		method: "POST",
		headers: { "Content-Type": "application/json", ...authHeaders },
		body: JSON.stringify({ content: "I get knee pain while climbing stairs. Give concise advice." }),
		signal: controller.signal,
	});

	if (!streamRes.ok || !streamRes.body) {
		clearTimeout(timeout);
		const responseBody = await streamRes.text();
		throw new Error(`Stream HTTP failure ${streamRes.status}: ${responseBody}`);
	}

	const reader = streamRes.body.getReader();
	const decoder = new TextDecoder();
	const events: StreamEvent[] = [];
	let buffer = "";
	let chunkCount = 0;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		chunkCount += 1;
		buffer += decoder.decode(value, { stream: true });
		buffer = consumeSseDataLines(buffer, (event) => events.push(event));

		if (events.some((event) => event.type === "done" || event.type === "error") || chunkCount >= 30) {
			await reader.cancel();
			break;
		}
	}

	clearTimeout(timeout);

	const ack = events.find((event): event is Extract<StreamEvent, { type: "ack" }> => event.type === "ack");
	const doneEvent = events.find((event): event is Extract<StreamEvent, { type: "done" }> => event.type === "done");
	const errorEvent = events.find((event): event is Extract<StreamEvent, { type: "error" }> => event.type === "error");

	const after = await request(`/chats/${chatId}`, { headers: authHeaders });
	const afterMessages = Array.isArray(after.body) ? after.body : [];

	const ackUserId = ack?.userMessage?.id;
	const ackAiId = ack?.aiMessage?.id;
	const rollbackVerified =
		!!errorEvent &&
		!!ackUserId &&
		!!ackAiId &&
		!afterMessages.some((message) => {
			const id = (message as { id?: string }).id;
			return id === ackUserId || id === ackAiId;
		});

	const result = {
		streamStatus: streamRes.status,
		sawAck: !!ack,
		sawDone: !!doneEvent,
		sawError: !!errorEvent,
		errorPayload: errorEvent ?? null,
		beforeCount,
		afterCount: afterMessages.length,
		rollbackVerified,
		eventTypes: events.map((event) => event.type),
	};

	console.log("STREAM_SMOKE_RESULT");
	console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
	console.error("STREAM_SMOKE_FAILED");
	console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
	process.exit(1);
});
