import axios from "axios";

const API_URL = "http://localhost:4000/api";
const EMAIL = `symptom_test_${Date.now()}@example.com`;
const PASSWORD = "password123";

async function testSymptoms() {
	try {
		let accessToken = "";
		console.log("1. Attempting Signup...");
		try {
			const signupRes = await axios.post(`${API_URL}/auth/signup`, {
				email: EMAIL,
				password: PASSWORD,
				name: "Symptom Test User",
				gender: "Male",
			});
			accessToken = signupRes.data.tokens.accessToken;
			console.log("Signup successful.");
		} catch (e: any) {
			console.log("Signup failed:", e.response?.data);
			return;
		}

		console.log("\n2. Analyzing Symptoms (Headache, Fever)...");
		const analyzeRes = await axios.post(
			`${API_URL}/ai/analyze`,
			{
				symptoms: ["severe headache", "high fever", "stiff neck"],
				language: "en",
			},
			{
				headers: { Authorization: `Bearer ${accessToken}` },
			}
		);

		console.log("Analysis Result:");
		console.log(JSON.stringify(analyzeRes.data, null, 2));
	} catch (error: any) {
		console.error("Test failed:", error.response?.status, error.response?.data || error.message);
	}
}

testSymptoms();
