import axios from "axios";

const API_URL = "http://localhost:4000/api";
const EMAIL = "test@example.com"; // Ensure this user exists or use signup
const PASSWORD = "password123";

async function testChatFlow() {
	try {
		console.log("1. Logging in...");
		const loginRes = await axios.post(`${API_URL}/auth/login`, {
			email: EMAIL,
			password: PASSWORD,
		});
		const token = loginRes.data.accessToken;
		console.log("Login successful. Token obtained.");

		const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

		console.log("\n2. Creating a new chat (English)...");
		const createRes = await axios.post(
			`${API_URL}/chats`,
			{
				title: "Test Chat 1",
				language: "en",
			},
			authHeaders
		);
		console.log("Chat created:", createRes.data);
		const chatId = createRes.data.id;

		console.log("\n3. Creating a new chat (Hindi)...");
		await axios.post(
			`${API_URL}/chats`,
			{
				title: "Test Chat Hindi",
				language: "hi",
			},
			authHeaders
		);

		console.log("\n4. Getting all chats...");
		const getRes = await axios.get(`${API_URL}/chats`, authHeaders);
		console.log(`Retrieved ${getRes.data.length} chats.`);

		console.log("\n5. Getting chat history for:", chatId);
		const historyRes = await axios.get(`${API_URL}/chats/${chatId}`, authHeaders);
		console.log(`History length: ${historyRes.data.length}`);

		console.log("\n6. Deleting chat:", chatId);
		await axios.delete(`${API_URL}/chats/${chatId}`, authHeaders);
		console.log("Chat deleted.");

		console.log("\n✅ Chat Flow Test Passed!");
	} catch (error: any) {
		console.error("❌ Test Failed:", error.response?.data || error.message);
	}
}

testChatFlow();
