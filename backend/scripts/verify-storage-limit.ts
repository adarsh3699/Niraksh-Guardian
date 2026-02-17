import axios from "axios";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";

dotenv.config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const API_URL = `http://127.0.0.1:${PORT}/api`;
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// Configure Cloudinary for the script
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DUMMY_PDF_PATH = path.join(__dirname, "../dummy_report.pdf");

const uploadDummyToCloudinary = async (userId: string, index: number) => {
	if (!fs.existsSync(DUMMY_PDF_PATH)) {
		throw new Error(`Dummy PDF not found at ${DUMMY_PDF_PATH}`);
	}
	const buffer = fs.readFileSync(DUMMY_PDF_PATH);
	const filename = `test_seed_${userId}_${index}_${Date.now()}`;

	return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
		cloudinary.uploader
			.upload_stream(
				{
					folder: "niraksh_reports",
					resource_type: "image", // Important: Match the controller logic
					public_id: filename,
					format: "pdf",
				},
				(error, result) => {
					if (error) return reject(error);
					if (!result) return reject(new Error("No result"));
					resolve({ url: result.secure_url, publicId: result.public_id });
				}
			)
			.end(buffer);
	});
};

const verifyResourceExists = async (publicId: string) => {
	try {
		await cloudinary.api.resource(publicId, { resource_type: "image" });
		return true;
	} catch (e) {
		return false;
	}
};

const testStorageLimit = async () => {
	console.log("🚀 Starting Comprehensive Storage Limit Verification...");

	try {
		// 1. Setup User (Direct DB)
		const email = `limit_real_${Date.now()}@example.com`;
		const name = "Real Limit Tester";

		// Create user directly
		const user = await prisma.user.create({
			data: {
				email,
				name,
				gender: "Male",
				passwordHash: "dummy_hash", // We don't need to login, just need user to exist
				isEmailVerified: true,
			},
		});
		const userId = user.id;

		// Generate Token Manually
		const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
		console.log(`✅ User created & authenticated (Bypassed API): ${userId}`);

		// Ensure Profile
		const profile = await prisma.patientHealthProfile.findUnique({ where: { userId } });
		if (!profile) {
			await prisma.patientHealthProfile.create({
				data: {
					userId,
					healthRiskScore: 0,
					bloodGroup: "O+",
					chronicConditions: [],
					allergies: [],
				},
			});
		}

		// 2. Scenario 1: Fresh User (0 -> 1)
		console.log("\n--- Scenario 1: Fresh User (0 -> 1) ---");
		const res1 = await axios.get(`${API_URL}/reports/health-summary`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (res1.status === 200) console.log("✅ Report 1 Generated");
		const count1 = await prisma.healthReport.count({ where: { userId } });
		console.log(`📊 Count: ${count1} (Expected: 1)`);

		// 3. Scenario 2: Fill up to 10 (1 -> 10)
		console.log("\n--- Scenario 2: Fill to Limit (1 -> 10) ---");
		// We already have 1. Seed 9 more.
		console.log("🌱 Seeding 9 more reports with REAL Cloudinary uploads...");
		const seededIds: string[] = [];

		for (let i = 0; i < 9; i++) {
			const { url, publicId } = await uploadDummyToCloudinary(userId, i); // Uploading dummy_report.pdf
			await prisma.healthReport.create({
				data: {
					userId,
					reportUrl: url,
					publicId: publicId,
					createdAt: new Date(Date.now() - 1000 * 60 * 60 * (10 - i)), // 10 hours ago, 9 hours ago...
				},
			});
			seededIds.push(publicId);
			process.stdout.write(".");
		}
		console.log("\n✅ Seeding complete.");

		const count2 = await prisma.healthReport.count({ where: { userId } });
		console.log(`📊 Count: ${count2} (Expected: 10)`);

		// Find the oldest. It should be one of our seeds (the first one we created with -10 hours).
		const oldest = await prisma.healthReport.findFirst({
			where: { userId },
			orderBy: { createdAt: "asc" },
		});
		if (oldest?.publicId) {
			console.log("🛑 Oldest Report Public ID:", oldest.publicId);
		}

		// 4. Scenario 3: Exceed Limit (10 -> 10, Rotation)
		console.log("\n--- Scenario 3: Exceed Limit (10 -> 10 + Rotation) ---");

		// Add delay to prevent AI Rate Limit
		console.log("⏳ Waiting 5 seconds before generating report...");
		await new Promise((resolve) => setTimeout(resolve, 5000));

		console.log("⚡ Generating 11th report...");

		const res2 = await axios.get(`${API_URL}/reports/health-summary`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (res2.status === 200) console.log("✅ Report 11 Generated");

		const count3 = await prisma.healthReport.count({ where: { userId } });
		console.log(`📊 Count: ${count3} (Expected: 10)`);

		// Verify rotation
		const oldestAfter = await prisma.healthReport.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
		if (oldestAfter?.id !== oldest?.id) {
			console.log("✅ Verified: Oldest DB record was removed.");
		} else {
			console.error("❌ Failed: Oldest DB record still exists.");
		}

		// Verify Object Storage Deletion
		if (oldest?.publicId) {
			const exists = await verifyResourceExists(oldest.publicId);
			if (!exists) {
				console.log("✅ Verified: Oldest PDF removed from Cloudinary.");
			} else {
				console.error("❌ Failed: Oldest PDF still exists in Cloudinary!");
			}
		}
	} catch (error: any) {
		console.error(
			"❌ Test Failed:",
			error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message
		);
		if (error instanceof Error) console.error(error.stack);
	} finally {
		await prisma.$disconnect();
	}
};

testStorageLimit();
