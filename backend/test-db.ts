import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	try {
		console.log("Connecting to DB...");
		await prisma.$connect();
		console.log("Connected.");

		const users = await prisma.user.findMany({ take: 1 });
		console.log("Users found:", users.length);

		const testEmail = "db-test@example.com";
		const user = await prisma.user.upsert({
			where: { email: testEmail },
			update: {},
			create: { email: testEmail, isEmailVerified: true },
		});
		console.log("Upsert successful:", user.id);

		await prisma.user.delete({ where: { email: testEmail } });
		console.log("Cleanup successful.");
	} catch (e) {
		console.error("DB Test Error:", e);
	} finally {
		await prisma.$disconnect();
	}
}

main();
