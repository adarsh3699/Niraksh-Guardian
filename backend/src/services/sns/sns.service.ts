import Validator from "sns-validator";
import { PrismaClient } from "@prisma/client";
import pino from "pino";

const logger = pino({ name: "sns-service" });
const prisma = new PrismaClient();

class SnsService {
	private validator: Validator;

	constructor(validatorInstance?: Validator) {
		this.validator = validatorInstance || new Validator();
	}

	async handleMessage(body: any): Promise<void> {
		return new Promise((resolve, reject) => {
			this.validator.validate(body, async (err, message) => {
				if (err) {
					logger.error(err, "SNS Signature Verification Failed");
					return reject(new Error("Invalid SNS Signature"));
				}

				try {
					await this.processMessage(message);
					resolve();
				} catch (processError) {
					logger.error(processError, "Error processing SNS message");
					reject(processError);
				}
			});
		});
	}

	private async processMessage(message: any) {
		const type = message.Type;

		if (type === "SubscriptionConfirmation") {
			logger.info(`Confirming SNS subscription for topic ${message.TopicArn}`);
			// In production, you might want to auto-confirm using `axios.get(message.SubscribeURL)`
			// For now, logging the SubscribeURL so admin can click it is safer or good enough.
			logger.info(`Subscribe URL: ${message.SubscribeURL}`);
			// To auto-confirm:
			// await axios.get(message.SubscribeURL);
			return;
		}

		if (type === "Notification") {
			const rawMessage = message.Message;
			let sesMessage;
			try {
				sesMessage = JSON.parse(rawMessage);
			} catch (e) {
				logger.error("Failed to parse SNS Notification Message JSON");
				return;
			}

			const notificationType = sesMessage.notificationType;

			if (notificationType === "Bounce") {
				await this.handleBounce(sesMessage.bounce);
			} else if (notificationType === "Complaint") {
				await this.handleComplaint(sesMessage.complaint);
			}
		}
	}

	private async handleBounce(bounce: any) {
		const bounceType = bounce.bounceType;
		const bouncedRecipients = bounce.bouncedRecipients;

		logger.info(`Processing Bounce: ${bounceType}`);

		// Permanent bounces (Hard Bounce) should deactivate user
		if (bounceType === "Permanent") {
			for (const recipient of bouncedRecipients) {
				const email = recipient.emailAddress;
				await this.deactivateUser(email, "Hard Bounce");
			}
		}
	}

	private async handleComplaint(complaint: any) {
		const complainedRecipients = complaint.complainedRecipients;
		logger.info("Processing Complaint");

		for (const recipient of complainedRecipients) {
			const email = recipient.emailAddress;
			await this.deactivateUser(email, "Complaint");
		}
	}

	private async deactivateUser(email: string, reason: string) {
		try {
			const user = await prisma.user.update({
				where: { email },
				data: {
					isActive: false,
					// statusReason: reason, // If we added this field, useful for auditing
				},
			});
			logger.warn(`User ${email} deactivated due to ${reason}`);
		} catch (error) {
			logger.error(`Failed to deactivate user ${email}:`, error);
		}
	}
}

export { SnsService };
export const snsService = new SnsService();
