import { PrismaClient } from "@prisma/client";
import app from "../src/app";
import { generateAccessToken } from "../src/services/jwt/jwt";
import axios from "axios";
import http from "http";

const prisma = new PrismaClient();
const TEST_EMAIL = "api_test_history_standalone@example.com";
const PORT = 5002;
const BASE_URL = `http://localhost:${PORT}`;

async function runTest() {
	console.log("🚀 Starting History API Test...");

	// Start Server
	const server = http.createServer(app);
	await new Promise<void>((resolve) => server.listen(PORT, resolve));
	console.log(`   Server running on port ${PORT}`);

	let user: any;
	let token: string;
	let symptomHistoryId: string;

	try {
		// 1. Setup Data
		console.log("   Setting up test data...");
		// Ensure cleanup first
		await prisma.symptomAnalysisHistory.deleteMany({ where: { user: { email: TEST_EMAIL } } });
		await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });

		user = await prisma.user.create({
			data: {
				email: TEST_EMAIL,
				name: "API Test User",
				passwordHash: "hash",
			},
		});
		token = generateAccessToken(user.id, user.email);
		console.log("   User and Token created.");

		const symptom = await prisma.symptomAnalysisHistory.create({
			data: {
				userId: user.id,
				symptoms: ["Cough"],
				urgencyLevel: "Low",
				recommendedSpecialist: "General",
				predictedConditions: { condition: "Cold", probability: 0.8 },
				imageUrl: "https://res.cloudinary.com/dummy/image/upload/v123/mock.png",
			},
		});
		symptomHistoryId = symptom.id;
		console.log("   Symptom History created:", symptomHistoryId);

		// 2. Test GET History
		console.log("\n   Testing GET /api/history/symptom...");
		const getRes = await axios.get(`${BASE_URL}/api/history/symptom`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (getRes.status === 200 && Array.isArray(getRes.data) && getRes.data.length > 0) {
			console.log("   ✅ GET Success: Retrieved history items.");
		} else {
			throw new Error(`GET failed: ${getRes.status} ${JSON.stringify(getRes.data)}`);
		}

		// 3. Test DELETE History
		console.log("\n   Testing DELETE /api/history/symptom/:id...");
		const delRes = await axios.delete(`${BASE_URL}/api/history/symptom/${symptomHistoryId}`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (delRes.status === 200) {
			console.log("   ✅ DELETE Success.");
		} else {
			throw new Error(`DELETE failed: ${delRes.status}`);
		}

		// 4. Verify DB Deletion
		const check = await prisma.symptomAnalysisHistory.findUnique({ where: { id: symptomHistoryId } });
		if (!check) {
			console.log("   ✅ Database Verification: Record is gone.");
		} else {
			throw new Error("❌ Database Verification Failed: Record still exists.");
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
			await prisma.symptomAnalysisHistory.deleteMany({ where: { userId: user.id } });
			await prisma.user.delete({ where: { id: user.id } });
		}
		await prisma.$disconnect();
		server.close();
		console.log("   Done.");
	}
}

runTest();
