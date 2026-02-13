import { SnsService } from "./src/services/sns/sns.service";
import { PrismaClient } from "@prisma/client";

// Mock validator
const mockValidator = {
	validate: (body: any, cb: (err: any, message: any) => void) => {
		console.log("Mock Validator: Validating message...");
		// Return success with the body as the message
		cb(null, body);
	},
} as any;

const prisma = new PrismaClient();
const snsService = new SnsService(mockValidator);

async function testSnsWebhook() {
	const testEmail = "test-bounce@example.com";

	// 1. Create a dummy user
	console.log("Creating test user...");
	await prisma.user.upsert({
		where: { email: testEmail },
		update: { isActive: true },
		create: {
			email: testEmail,
			isActive: true,
			isEmailVerified: true,
		},
	});

	console.log("User created/reset. isActive: true");

	// 2. Simulate Bounce Notification
	const bouncePayload = {
		Type: "Notification",
		MessageId: "mock-message-id",
		TopicArn: "arn:aws:sns:ap-south-1:123456789012:MyTopic",
		Message: JSON.stringify({
			notificationType: "Bounce",
			bounce: {
				bounceType: "Permanent",
				bouncedRecipients: [{ emailAddress: testEmail }],
			},
		}),
	};

	// 3. Process Message
	console.log("Processing SNS Message...");
	await snsService.handleMessage(bouncePayload);

	// 4. Verify User Deactivation
	const user = await prisma.user.findUnique({
		where: { email: testEmail },
	});

	if (user && user.isActive === false) {
		console.log("✅ User successfully deactivated!");
	} else {
		console.error("❌ User deactivation failed!", user);
		process.exit(1);
	}

	// Cleanup
	await prisma.user.delete({ where: { email: testEmail } });
	console.log("Cleanup complete.");
}

testSnsWebhook()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
