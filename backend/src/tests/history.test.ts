import { PrismaClient } from "@prisma/client";
import app from "../src/app";
import request from "supertest";
import { generateAccessToken } from "../src/services/jwt/jwt";

// Mock Cloudinary deletion
jest.mock("../src/services/cloudinary/cloudinary", () => ({
	...jest.requireActual("../src/services/cloudinary/cloudinary"),
	deleteImage: jest.fn().mockResolvedValue(true),
	extractPublicId: jest.fn().mockReturnValue("mock_public_id"),
}));

const prisma = new PrismaClient();
const TEST_EMAIL = "api_test_history@example.com";

describe("History API Endpoints", () => {
	let user: { id: string; email: string };
	let token: string;
	let symptomHistoryId: string;

	beforeAll(async () => {
		// Create User
		user = await prisma.user.create({
			data: {
				email: TEST_EMAIL,
				name: "API Test User",
				passwordHash: "hash",
			},
		});
		// Create Token
		token = generateAccessToken(user.id, user.email);

		// Create initial history item
		const symptom = await prisma.symptomAnalysisHistory.create({
			data: {
				userId: user.id,
				symptoms: ["Cough"],
				urgencyLevel: "Low",
				recommendedSpecialist: "General",
				predictedConditions: {},
				imageUrl: "https://res.cloudinary.com/dummy/image/upload/v123/mock.png",
			},
		});
		symptomHistoryId = symptom.id;
	}, 30000);

	afterAll(async () => {
		await prisma.symptomAnalysisHistory.deleteMany({ where: { userId: user.id } });
		await prisma.user.delete({ where: { id: user.id } });
		await prisma.$disconnect();
	}, 30000);

	it("should fetch symptom history", async () => {
		const res = await request(app).get("/api/history/symptom").set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
		expect(res.body.length).toBeGreaterThan(0);
		expect(res.body[0].id).toBe(symptomHistoryId);
	});

	it("should delete symptom history item", async () => {
		const res = await request(app)
			.delete(`/api/history/symptom/${symptomHistoryId}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.message).toBe("Record deleted successfully");

		// Verify deletion in DB
		const check = await prisma.symptomAnalysisHistory.findUnique({
			where: { id: symptomHistoryId },
		});
		expect(check).toBeNull();
	});
});
