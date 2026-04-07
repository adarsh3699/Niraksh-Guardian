import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL || "http://127.0.0.1:4000/api";

const readRefreshCookie = (response: Response): string | null => {
	const setCookie = response.headers.get("set-cookie");
	if (!setCookie) return null;
	const match = setCookie.match(/refresh_token=([^;]+)/);
	if (!match) return null;
	return `refresh_token=${match[1]}`;
};

const testAuth = async () => {
	console.log("Starting Authentication Verification...");

	try {
		const timestamp = Date.now();
		const email = `auth_test_${timestamp}@example.com`;
		const password = "password123";
		const name = "Auth Tester";

		// 1. Signup
		console.log(`\n--- 1. Testing Signup (${email}) ---`);
		const signupRes = await fetch(`${API_URL}/auth/signup`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email,
				password,
				name,
				gender: "Female",
			}),
		});
		const signupData = (await signupRes.json()) as {
			user?: { id?: string };
			tokens?: { accessToken?: string };
		};

		if (signupRes.status === 201 && signupData.tokens?.accessToken) {
			console.log("Signup Successful");
			console.log(`   User ID: ${signupData.user?.id ?? "unknown"}`);
		} else {
			throw new Error("Signup failed");
		}

		// 2. Login
		console.log("\n--- 2. Testing Login ---");
		const loginRes = await fetch(`${API_URL}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		const loginData = (await loginRes.json()) as {
			tokens?: { accessToken?: string };
		};
		const refreshCookie = readRefreshCookie(loginRes);

		if (loginRes.status === 200 && loginData.tokens?.accessToken && refreshCookie) {
			console.log("Login Successful");
		} else {
			throw new Error("Login failed");
		}

		const accessToken = loginData.tokens.accessToken;

		// 3. Verify Access Token (Get Profile)
		console.log("\n--- 3. Verifying Access Token (Get Profile) ---");
		const profileRes = await fetch(`${API_URL}/profile`, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		if (profileRes.status === 401) {
			throw new Error("Access Token Rejected");
		}
		if (profileRes.status === 404) {
			console.log("Access Token Verified (User authenticated, but profile missing - expected)");
		} else {
			console.log(`Access Token Verified (Status: ${profileRes.status})`);
		}

		// 4. Refresh Token
		console.log("\n--- 4. Testing Token Refresh ---");
		const refreshRes = await fetch(`${API_URL}/auth/refresh-token`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Cookie: refreshCookie,
			},
			body: JSON.stringify({}),
		});
		const refreshData = (await refreshRes.json()) as { accessToken?: string };

		if (refreshRes.status === 200 && refreshData.accessToken) {
			console.log("Token Refresh Successful");
		} else {
			throw new Error("Token Refresh Failed");
		}

		// 5. Logout
		console.log("\n--- 5. Testing Logout ---");
		const logoutRes = await fetch(`${API_URL}/auth/logout`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${refreshData.accessToken}`,
				Cookie: refreshCookie,
			},
			body: JSON.stringify({}),
		});

		if (logoutRes.status === 200) {
			console.log("Logout Successful");
		} else {
			throw new Error("Logout Failed");
		}

		console.log("\nAuthentication Flow Verified Successfully!");
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error("Test Failed:", message);
		process.exit(1);
	}
};

testAuth();
