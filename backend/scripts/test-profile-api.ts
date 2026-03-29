import { PrismaClient } from "@prisma/client";
import app from "../src/app";
import { generateAccessToken } from "../src/services/jwt/jwt";
import http from "http";

const prisma = new PrismaClient();
const TEST_EMAIL = "api_test_profile@example.com";
const PORT = 5003;
const BASE_URL = `http://localhost:${PORT}`;

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
	const data = (await response.json()) as T;
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
	}
	return data;
};

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

		const putRes = await fetch(`${BASE_URL}/api/profile`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(updateData),
		});
		const putData = await parseJsonResponse<any>(putRes);

		if (putRes.status === 200) {
			console.log("   ✅ PUT Success.");
			console.log("   Risk Score:", putData.healthProfile?.healthRiskScore);
			if (putData.healthProfile?.healthRiskScore === 20) {
				console.log("   ✅ Risk Score Calculation Correct (20).");
			} else {
				throw new Error(`Risk Score Incorrect. Expected 20, got ${putData.healthProfile?.healthRiskScore}`);
			}
		} else {
			throw new Error(`PUT failed: ${putRes.status}`);
		}

		// 3. Test GET Profile
		console.log("\n   Testing GET /api/profile...");
		const getRes = await fetch(`${BASE_URL}/api/profile`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		const getData = await parseJsonResponse<any>(getRes);

		if (getRes.status === 200 && getData.healthProfile?.bloodGroup === "B+") {
			console.log("   ✅ GET Success: Retrieved profile.");
		} else {
			throw new Error(`GET failed: ${getRes.status}`);
		}
	} catch (error: any) {
		console.error("   ❌ Test Failed:", error.message);
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
