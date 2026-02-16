import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
	log: ["query", "info", "warn", "error"],
});

async function verifyDatabaseUpdates() {
	console.log("🚀 Verifying Database Schema Updates...");
	// Set a timeout to prevent hanging
	const timeout = setTimeout(() => {
		console.error("❌ Operation timed out after 30s");
		process.exit(1);
	}, 30000);

	try {
		await prisma.$connect();
		console.log("   ✅ Database connected.");

		// 1. Create a dummy user (or find existing) to link records to
		let user = await prisma.user.findFirst({
			where: { email: "test_history_db@example.com" },
		});

		if (!user) {
			console.log("   Creating dummy user for test...");
			user = await prisma.user.create({
				data: {
					email: "test_history_db@example.com",
					name: "History Test User",
					passwordHash: "dummyhash",
				},
			});
		}
		console.log(`   Using User ID: ${user.id}`);

		// 2. Test PatientHealthProfile creation
		console.log("   Testing PatientHealthProfile...");
		const profile = await prisma.patientHealthProfile.create({
			data: {
				userId: user.id,
				bloodGroup: "O+",
				allergies: ["Peanuts"],
				chronicConditions: ["None"],
				healthRiskScore: 10,
			},
		});
		console.log("   ✅ PatientHealthProfile created:", profile.id);

		// 3. Test SymptomAnalysisHistory creation
		console.log("   Testing SymptomAnalysisHistory...");
		const symptomHistory = await prisma.symptomAnalysisHistory.create({
			data: {
				userId: user.id,
				symptoms: ["Headache", "Fever"],
				urgencyLevel: "Mild",
				recommendedSpecialist: "General Physician",
				predictedConditions: { condition: "Flu", probability: 0.9 },
			},
		});
		console.log("   ✅ SymptomAnalysisHistory created:", symptomHistory.id);

		// Cleanup
		console.log("   Cleaning up test data...");
		await prisma.patientHealthProfile.delete({ where: { id: profile.id } });
		await prisma.symptomAnalysisHistory.delete({ where: { id: symptomHistory.id } });
		await prisma.user.delete({ where: { id: user.id } });

		console.log("   ✅ Cleanup complete.");
		clearTimeout(timeout);
	} catch (error) {
		console.error("   ❌ Verification failed:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

verifyDatabaseUpdates();
