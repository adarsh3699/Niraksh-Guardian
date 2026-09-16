import prisma from "../src/db/prisma";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
	console.error("Usage: pnpm admin:promote admin@example.com");
	process.exitCode = 1;
} else {
	try {
		const user = await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
		console.log(`Admin access enabled for ${user.email}`);
	} catch (error) {
		console.error("Could not promote admin. Confirm that the user account already exists.", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}
