import { PrismaClient } from "@prisma/client";
import app from "../src/app";
import { generateAccessToken } from "../src/services/jwt/jwt";
import axios from "axios";
import http from "http";

const prisma = new PrismaClient();
const TEST_EMAIL = "api_test_profile@example.com";
const PORT = 5003;
const BASE_URL = `http://localhost:${PORT}`;

async function runTest() {
	console.log("🚀 Starting Profile API Test...");

	// Start Server
	const server = http.createServer(app);
	await new Promise<void>((resolve) => server.listen(PORT, resolve));
	console.log(`   Server running on port ${PORT}`);

	let user: any;
	let token: string;

	try {
		// 1. Setup Data
		console.log("   Setting up test data...");
		await prisma.patientHealthProfile.deleteMany({ where: { user: { email: TEST_EMAIL } } });
		await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });

		user = await prisma.user.create({
			data: {
				email: TEST_EMAIL,
				name: "Profile Test User",
				passwordHash: "hash",
			},
		});
		token = generateAccessToken(user.id, user.email);
		console.log("   User and Token created.");

		// 2. Test PUT Profile (Create/Update)
		console.log("\n   Testing PUT /api/profile...");
		const updateData = {
			bloodGroup: "B+",
			allergies: ["Dust"],
			chronicConditions: ["Diabetes", "Hypertension"], // Should give 20 points
			emergencyContactName: "Mom",
			emergencyContactPhone: "1234567890",
		};

		const putRes = await axios.put(`${BASE_URL}/api/profile`, updateData, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (putRes.status === 200) {
			console.log("   ✅ PUT Success.");
			console.log("   Risk Score:", putRes.data.healthRiskScore);
			if (putRes.data.healthRiskScore === 20) {
				console.log("   ✅ Risk Score Calculation Correct (20).");
			} else {
				throw new Error(`Risk Score Incorrect. Expected 20, got ${putRes.data.healthRiskScore}`);
			}
		} else {
			throw new Error(`PUT failed: ${putRes.status}`);
		}

		// 3. Test GET Profile
		console.log("\n   Testing GET /api/profile...");
		const getRes = await axios.get(`${BASE_URL}/api/profile`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (getRes.status === 200 && getRes.data.bloodGroup === "B+") {
			console.log("   ✅ GET Success: Retrieved profile.");
		} else {
			throw new Error(`GET failed: ${getRes.status}`);
		}
	} catch (error: any) {
		console.error("   ❌ Test Failed:", error.message);
		if (error.response) {
			console.error("   Response Data:", error.response.data);
		}
		process.exit(1);
	} finally {
		// Cleanup
		console.log("\n   Cleaning up...");
		if (user) {
			await prisma.patientHealthProfile.deleteMany({ where: { userId: user.id } });
			await prisma.user.delete({ where: { id: user.id } });
		}
		await prisma.$disconnect();
		server.close();
		console.log("   Done.");
	}
}

runTest();
