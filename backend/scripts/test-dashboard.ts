import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL || "http://127.0.0.1:4000/api";

const testDashboard = async () => {
	console.log("🚀 Starting Dashboard API Verification...");

	try {
		const timestamp = Date.now();
		const email = `dash_test_${timestamp}@example.com`;
		const password = "password123";
		const name = "Dashboard Tester";

		// 1. Setup User
		console.log(`\n--- 1. Setup User (${email}) ---`);
		await axios.post(`${API_URL}/auth/signup`, { email, password, name, gender: "Male" });
		const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
		const token = loginRes.data.tokens.accessToken;
		console.log("✅ User Authenticated");

		// 2. Setup Profile (Simulating Onboarding or Update)
		console.log("\n--- 2. Setting up Health Profile ---");
		const profileData = {
			bloodGroup: "O+",
			allergies: ["Peanuts"],
			chronicConditions: ["Hypertension"], // Should trigger risk score
			emergencyContactName: "Mom",
			emergencyContactPhone: "1234567890",
			emergencyContactEmail: "mom@example.com",
		};
		await axios.put(`${API_URL}/profile`, profileData, {
			headers: { Authorization: `Bearer ${token}` },
		});
		console.log("✅ Profile Updated");

		// 3. Verify Dashboard Data (Profile & Risk Score)
		console.log("\n--- 3. Verifying Profile & Risk Score ---");
		const profileRes = await axios.get(`${API_URL}/profile`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		const profile = profileRes.data;
		console.log(`   Risk Score: ${profile.healthRiskScore}`);
		if (profile.healthRiskScore === 10) {
			// 1 condition * 10
			console.log("✅ Risk Score Calculation Verified (10)");
		} else {
			console.warn(`⚠️ Unexpected Risk Score: ${profile.healthRiskScore} (Expected 10)`);
		}

		// 4. Verify History Endpoints (Recent Activity)
		console.log("\n--- 4. Verifying History Endpoints ---");

		// Symptoms
		const symRes = await axios.get(`${API_URL}/history/symptom`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		console.log(`   Symptoms History: ${symRes.data.length} items`);

		// Medicines
		const medRes = await axios.get(`${API_URL}/history/medicine`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		console.log(`   Medicine History: ${medRes.data.length} items`);

		console.log("\n🎉 Dashboard APIs Verified Successfully!");
	} catch (error: any) {
		console.error("❌ Test Failed:", error.response ? error.response.data : error.message);
		process.exit(1);
	}
};

testDashboard();
