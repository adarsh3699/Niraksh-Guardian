import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	try {
		console.log("Verifying database connection...");
		await prisma.$connect();
		console.log("Connected to database.");

		console.log("Checking for MedicineHistory table...");
		const medicineHistoryCount = await prisma.medicineHistory.count();
		console.log(`MedicineHistory table accessible. Count: ${medicineHistoryCount}`);

		console.log("Checking for PrescriptionHistory table...");
		const prescriptionHistoryCount = await prisma.prescriptionHistory.count();
		console.log(`PrescriptionHistory table accessible. Count: ${prescriptionHistoryCount}`);

		console.log("Checking for DrugInteractionHistory table...");
		const drugInteractionHistoryCount = await prisma.drugInteractionHistory.count();
		console.log(`DrugInteractionHistory table accessible. Count: ${drugInteractionHistoryCount}`);

		console.log("Verification successful!");
	} catch (error) {
		console.error("Verification failed:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

main();
