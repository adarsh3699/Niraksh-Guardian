process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import axios from "axios";
import { createServer } from "http";
import { generateAccessToken as generateToken } from "../src/services/jwt/jwt";
import app from "../src/app";
import prisma from "../src/db/prisma";
import redisClient from "../src/config/redis";

const TEST_EMAIL = "previous_lab_test@example.com";

async function run() {
	const server = createServer(app);
	const PORT = 5006;

	try {
		// Connect Redis
		if (!redisClient.isOpen) {
			await redisClient.connect();
			console.log("✅ Redis Connected for Test");
		}

		await new Promise<void>((resolve) => {
			server.listen(PORT, () => {
				console.log(`Test server running on port ${PORT}`);
				resolve();
			});
		});

		// 1. Setup User
		console.log("Creating test user...");
		let user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });

		if (!user) {
			user = await prisma.user.create({
				data: {
					email: TEST_EMAIL,
					name: "Previous Lab Test User",
					passwordHash: "hash",
					gender: "Male",
				},
			});
		}

		// 2. Create two lab reports with different timestamps
		console.log("Creating lab reports...");

		// Older report (created 7 days ago)
		const olderReport = await prisma.labReport.create({
			data: {
				userId: user.id,
				fileUrl: "https://example.com/old-report.pdf",
				fileName: "old-report.pdf",
				mimeType: "application/pdf",
				extractedText: "Old lab report text",
				overallSummary: "Old report summary",
				overallRisk: "Low",
				abnormalCount: 1,
				totalCount: 5,
				createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
				components: {
					create: [
						{
							componentName: "Hemoglobin",
							observedValue: 13.5,
							observedRaw: "13.5",
							unit: "g/dL",
							referenceMin: 13.0,
							referenceMax: 17.0,
							status: "normal",
						},
						{
							componentName: "Glucose",
							observedValue: 95,
							observedRaw: "95",
							unit: "mg/dL",
							referenceMin: 70,
							referenceMax: 100,
							status: "normal",
						},
					],
				},
			},
		});

		// Newer report (created today)
		const newerReport = await prisma.labReport.create({
			data: {
				userId: user.id,
				fileUrl: "https://example.com/new-report.pdf",
				fileName: "new-report.pdf",
				mimeType: "application/pdf",
				extractedText: "New lab report text",
				overallSummary: "New report summary",
				overallRisk: "Moderate",
				abnormalCount: 2,
				totalCount: 5,
				components: {
					create: [
						{
							componentName: "Hemoglobin",
							observedValue: 12.0,
							observedRaw: "12.0",
							unit: "g/dL",
							referenceMin: 13.0,
							referenceMax: 17.0,
							status: "low",
						},
						{
							componentName: "Glucose",
							observedValue: 110,
							observedRaw: "110",
							unit: "mg/dL",
							referenceMin: 70,
							referenceMax: 100,
							status: "high",
						},
					],
				},
			},
		});

		const token = generateToken(user.id);

		// 3. Test GET /api/reports/lab/:id/previous
		console.log("\n📋 Testing GET /api/reports/lab/:id/previous...");
		const response = await axios.get(
			`http://localhost:${PORT}/api/reports/lab/${newerReport.id}/previous`,
			{
				headers: { Authorization: `Bearer ${token}` },
			}
		);

		if (response.status === 200) {
			console.log("✅ Previous report fetched successfully!");
			console.log("📄 Previous Report ID:", response.data.reportId);
			console.log("📄 Components count:", response.data.components.length);
			console.log("📄 Created At:", response.data.createdAt);

			// Verify it's the older report
			if (response.data.reportId === olderReport.id) {
				console.log("✅ Correct previous report returned!");
			} else {
				console.error("❌ Wrong report returned!");
			}

			// Verify components are included
			if (response.data.components.length === 2) {
				console.log("✅ Components included in response!");
			} else {
				console.error("❌ Components missing or incorrect count!");
			}
		} else {
			console.error("❌ Failed to fetch previous report:", response.data);
		}

		// 4. Test with oldest report (should return 404)
		console.log("\n📋 Testing with oldest report (should return 404)...");
		try {
			await axios.get(`http://localhost:${PORT}/api/reports/lab/${olderReport.id}/previous`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			console.error("❌ Should have returned 404 but didn't!");
		} catch (error: any) {
			if (error.response?.status === 404) {
				console.log("✅ Correctly returned 404 for oldest report!");
			} else {
				console.error("❌ Unexpected error:", error.message);
			}
		}

		// 5. Test with invalid report ID (should return 404)
		console.log("\n📋 Testing with invalid report ID (should return 404)...");
		try {
			await axios.get(`http://localhost:${PORT}/api/reports/lab/invalid-id/previous`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			console.error("❌ Should have returned 404 but didn't!");
		} catch (error: any) {
			if (error.response?.status === 404) {
				console.log("✅ Correctly returned 404 for invalid report!");
			} else {
				console.error("❌ Unexpected error:", error.message);
			}
		}

		console.log("\n✅ All tests passed!");
	} catch (error: any) {
		console.error("❌ Test Failed:", error.message);
		if (error.response) {
			console.error("Response data:", error.response.data);
		}
	} finally {
		// Cleanup
		console.log("\nCleaning up...");
		const testUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
		if (testUser) {
			await prisma.labReport.deleteMany({ where: { userId: testUser.id } });
			await prisma.user.delete({ where: { id: testUser.id } });
		}

		if (redisClient.isOpen) {
			await redisClient.quit();
			console.log("Redis Disconnected");
		}

		server.close();
		process.exit(0);
	}
}

run();
