process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Ignore SSL errors for local test due to proxy/cert issues
import axios from "axios";
import { createServer } from "http";
import { generateAccessToken as generateToken } from "../src/services/jwt/jwt";
import app from "../src/app";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import redisClient from "../src/config/redis";

const prisma = new PrismaClient();
const TEST_EMAIL = "report_test_user@example.com";
const OUTPUT_FILE = "test_report.pdf";

async function run() {
	const server = createServer(app);
	const PORT = 5005;

	try {
		// Connect Redis manually for the test context
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

		// 1. Setup User and Data (Prisma)
		console.log("Creating test user and health data...");
		let user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });

		if (!user) {
			user = await prisma.user.create({
				data: {
					email: TEST_EMAIL,
					name: "Report Test User",
					passwordHash: "hash",
					gender: "Male",
				},
			});
		}

		// Ensure Profile
		await prisma.patientHealthProfile.upsert({
			where: { userId: user.id },
			create: {
				userId: user.id,
				bloodGroup: "O+",
				chronicConditions: ["Hypertension"],
				allergies: ["Peanuts"],
				healthRiskScore: 10,
			},
			update: {
				bloodGroup: "O+",
				chronicConditions: ["Hypertension"],
				allergies: ["Peanuts"],
				healthRiskScore: 10,
			},
		});

		// Ensure Symptom History
		// Clean up old history first to ensure fresh data
		await prisma.symptomAnalysisHistory.deleteMany({ where: { userId: user.id } });

		await prisma.symptomAnalysisHistory.create({
			data: {
				userId: user.id,
				symptoms: ["Headache", "Dizziness"],
				urgencyLevel: "Moderate",
				recommendedSpecialist: "General Physician",
				predictedConditions: { conditions: ["Migraine", "Stress"] },
				createdAt: new Date(),
			},
		});

		const token = generateToken(user.id);

		// 2. Request PDF Report Generation
		console.log("Requesting Health Report Generation...");
		const response = await axios.get(`http://localhost:${PORT}/api/reports/health-summary`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (response.status === 200 && response.data.reportUrl) {
			console.log("✅ Report Generated Successfully!");
			console.log("📄 Report URL:", response.data.reportUrl);
		} else {
			console.error("❌ Failed to generate report:", response.data);
		}
	} catch (error: any) {
		console.error("❌ Test Failed:", error.message);
		if (error.response) {
			// Convert buffer to string for error message
			console.error("Response data:", error.response.data.toString());
		}
	} finally {
		// Cleanup
		console.log("Cleaning up...");
		const testUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
		if (testUser) {
			await prisma.symptomAnalysisHistory.deleteMany({ where: { userId: testUser.id } });
			await prisma.patientHealthProfile.delete({ where: { userId: testUser.id } }).catch(() => {});
			await prisma.user.delete({ where: { id: testUser.id } });
		}
		await prisma.$disconnect();

		if (redisClient.isOpen) {
			await redisClient.quit();
			console.log("Redis Disconnected");
		}

		server.close();
		process.exit(0);
	}
}

run();
