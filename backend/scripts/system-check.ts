import axios from "axios";
import FormData from "form-data";

const API_URL = "http://localhost:4000/api";
// Use a shorter, simpler email to avoid potential validation issues with long constraints?
// But unique is key.
const EMAIL = `verify_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
const PASSWORD = "password123";

async function verifySystem() {
	console.log("🚀 Starting System Verification...");
	console.log(`   User: ${EMAIL}`);

	let accessToken = "";
	let userId = "";
	let chatId = "";

	try {
		// 1. Authentication
		console.log("\n1️⃣  Testing Authentication...");

		try {
			console.log("   Attempting Signup...");
			const signupRes = await axios.post(`${API_URL}/auth/signup`, {
				email: EMAIL,
				password: PASSWORD,
				name: "Verify User",
				gender: "Other",
			});
			accessToken = signupRes.data.tokens.accessToken;
			userId = signupRes.data.user.id;
			console.log("   ✅ Signup successful");
		} catch (signupError: any) {
			console.log(
				`   ⚠️  Signup failed: ${signupError.response?.status} - ${JSON.stringify(signupError.response?.data || signupError.message)}`
			);

			// If it's a 429, we likely can't login either, but let's try if the user exists
			if (signupError.response?.status === 409) {
				console.log("   User exists, attempting login...");
			} else if (signupError.response?.status === 429) {
				console.log("   🛑 Rate Limit Triggered. Waiting 2 seconds...");
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}

			try {
				const loginRes = await axios.post(`${API_URL}/auth/login`, {
					email: EMAIL,
					password: PASSWORD,
				});
				accessToken = loginRes.data.tokens.accessToken;
				userId = loginRes.data.user.id;
				console.log("   ✅ Login successful");
			} catch (loginError: any) {
				console.error(
					`   ❌ Login failed: ${loginError.response?.status} - ${JSON.stringify(loginError.response?.data || loginError.message)}`
				);
				// If 500, it's the DB error again
				process.exit(1);
			}
		}

		// 2. Education API (Gemini Text)
		console.log("\n2️⃣  Testing Education API (Text)...");
		try {
			const eduRes = await axios.get(`${API_URL}/education/info?topic=Flu`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			});
			if (eduRes.data.name && eduRes.data.symptoms) {
				console.log("   ✅ Education Info retrieved successfully");
			} else {
				throw new Error("Invalid response structure");
			}
		} catch (error: any) {
			console.error(
				`   ❌ Education API failed: ${error.response?.status} - ${JSON.stringify(error.response?.data || error.message)}`
			);
		}

		// 3. Chat API (Gemini Multimodal)
		console.log("\n3️⃣  Testing Chat API (Multimodal)...");

		// Create Chat
		try {
			const chatRes = await axios.post(
				`${API_URL}/chats`,
				{ title: "Verification Chat" },
				{ headers: { Authorization: `Bearer ${accessToken}` } }
			);
			chatId = chatRes.data.id;
			console.log("   ✅ Chat created");

			// Send Image Message
			const imageBuffer = Buffer.from(
				"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
				"base64"
			);

			const form = new FormData();
			form.append("content", "Analyze this test image.");
			form.append("image", imageBuffer, { filename: "test.png", contentType: "image/png" });

			const messageRes = await axios.post(`${API_URL}/chats/${chatId}/messages`, form, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
					...form.getHeaders(),
				},
			});

			if (messageRes.data.aiMessage && messageRes.data.aiMessage.content) {
				console.log("   ✅ Multimodal Message processed");
				console.log("      AI Response Preview:", messageRes.data.aiMessage.content.substring(0, 50) + "...");
			} else {
				console.error("   ❌ No AI response content found");
			}
		} catch (error: any) {
			console.error(
				`   ❌ Chat API failed: ${error.response?.status} - ${JSON.stringify(error.response?.data || error.message)}`
			);
		}

		console.log("\n🎉 Verification Complete!");
	} catch (error: any) {
		console.error("\n❌ System Verification Failed:", error.message);
	}
}

verifySystem();
