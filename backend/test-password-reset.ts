import axios from "axios";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();
const API_URL = "http://localhost:4000/api/auth";
const TEST_EMAIL = "test-reset@example.com";
const TEST_PASSWORD = "Password123!";
const NEW_PASSWORD = "NewPassword123!";

function hashToken(token: string): string {
	return crypto.createHash("sha256").update(token).digest("hex");
}

async function testPasswordReset() {
	try {
		console.log("Starting Password Reset Test...");

		// 1. Cleanup
		await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });

		// 2. Create User
		await axios.post(`${API_URL}/signup`, {
			email: TEST_EMAIL,
			password: TEST_PASSWORD,
		});
		console.log("✅ User created");

		// 3. Request Password Reset
		await axios.post(`${API_URL}/forgot-password`, {
			email: TEST_EMAIL,
		});
		console.log("✅ Forgot password request sent");

		// 4. Get Token from DB
		const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
		if (!user) throw new Error("User not found");

		const resetTokenEntry = await prisma.passwordResetToken.findFirst({
			where: { userId: user.id },
		});

		if (!resetTokenEntry) throw new Error("Reset token not found in DB");
		console.log("✅ Reset token found in DB");

		const knownToken = "my-secret-reset-token";
		const knownTokenHash = hashToken(knownToken);

		await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }); // Clear existing
		await prisma.passwordResetToken.create({
			data: {
				userId: user.id,
				tokenHash: knownTokenHash,
				expiresAt: new Date(Date.now() + 3600000),
			},
		});
		console.log("✅ Manually updated token in DB for testing");

		// 5. Reset Password
		await axios.post(`${API_URL}/reset-password`, {
			token: knownToken,
			password: NEW_PASSWORD,
		});
		console.log("✅ Password reset successful");

		// 6. Login with New Password
		const loginResponse = await axios.post(`${API_URL}/login`, {
			email: TEST_EMAIL,
			password: NEW_PASSWORD,
		});

		if (loginResponse.status === 200) {
			console.log("✅ Login with new password successful");
		} else {
			throw new Error("Login failed");
		}

		// 7. Cleanup
		await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
		console.log("✅ Cleanup complete");
	} catch (error: any) {
		console.error("❌ Test Failed:", error.response?.data || error); // Log full error if no response data
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

testPasswordReset();
