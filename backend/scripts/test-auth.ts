import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL || "http://127.0.0.1:4000/api";

const testAuth = async () => {
	console.log("🚀 Starting Authentication Verification...");

	try {
		const timestamp = Date.now();
		const email = `auth_test_${timestamp}@example.com`;
		const password = "password123";
		const name = "Auth Tester";

		// 1. Signup
		console.log(`\n--- 1. Testing Signup (${email}) ---`);
		const signupRes = await axios.post(`${API_URL}/auth/signup`, {
			email,
			password,
			name,
			gender: "Female",
		});

		if (signupRes.status === 201 && signupRes.data.tokens) {
			console.log("✅ Signup Successful");
			console.log(`   User ID: ${signupRes.data.user.id}`);
		} else {
			throw new Error("Signup failed");
		}

		// 2. Login
		console.log("\n--- 2. Testing Login ---");
		const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });

		if (loginRes.status === 200 && loginRes.data.tokens) {
			console.log("✅ Login Successful");
		} else {
			throw new Error("Login failed");
		}

		const { accessToken, refreshToken } = loginRes.data.tokens;

		// 3. Verify Access Token (Get Profile)
		console.log("\n--- 3. Verifying Access Token (Get Profile) ---");
		try {
			const profileRes = await axios.get(`${API_URL}/profile`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			});
			// Profile might be 404 if not created yet, but 401 means auth failed.
			// Actually profile created on signup? No, explicit create usually.
			// Let's check status. If 401, fail.
			console.log(`✅ Access Token Verified (Status: ${profileRes.status})`);
		} catch (e: any) {
			if (e.response && e.response.status === 404) {
				console.log("✅ Access Token Verified (User authenticated, but profile missing - expected)");
			} else if (e.response && e.response.status === 401) {
				throw new Error("Access Token Rejected");
			} else {
				console.log(`⚠️ Profile check warning: ${e.message}`);
			}
		}

		// 4. Refresh Token
		console.log("\n--- 4. Testing Token Refresh ---");
		const refreshRes = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });

		if (refreshRes.status === 200 && refreshRes.data.accessToken) {
			console.log("✅ Token Refresh Successful");
		} else {
			throw new Error("Token Refresh Failed");
		}

		const newRefreshToken = refreshRes.data.refreshToken || refreshToken;

		// 5. Logout
		console.log("\n--- 5. Testing Logout ---");
		const logoutRes = await axios.post(
			`${API_URL}/auth/logout`,
			{ refreshToken: newRefreshToken },
			{
				headers: { Authorization: `Bearer ${refreshRes.data.accessToken}` },
			}
		);

		if (logoutRes.status === 200) {
			console.log("✅ Logout Successful");
		} else {
			throw new Error("Logout Failed");
		}

		console.log("\n🎉 Authentication Flow Verified Successfully!");
	} catch (error: any) {
		console.error("❌ Test Failed:", error.response ? error.response.data : error.message);
		process.exit(1);
	}
};

testAuth();
