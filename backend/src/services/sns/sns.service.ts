import Validator from "sns-validator";
import { PrismaClient } from "../../generated/prisma";
import logger from "../../config/logger";

const prisma = new PrismaClient();

interface SnsMessage {
	Type: string;
	TopicArn?: string;
	SubscribeURL?: string;
	Message: string;
}

interface BounceRecipient {
	emailAddress: string;
}

interface Bounce {
	bounceType: string;
	bouncedRecipients: BounceRecipient[];
}

interface Complaint {
	complainedRecipients: BounceRecipient[];
}

class SnsService {
	private validator: Validator;

	constructor(validatorInstance?: Validator) {
		this.validator = validatorInstance || new Validator();
	}

	async handleMessage(body: Record<string, unknown>): Promise<void> {
		return new Promise((resolve, reject) => {
			this.validator.validate(body, async (err, message) => {
				if (err) {
					logger.error(err, "SNS Signature Verification Failed");
					return reject(new Error("Invalid SNS Signature"));
				}

				try {
					await this.processMessage(message as unknown as SnsMessage);
					resolve();
				} catch (processError) {
					logger.error(processError, "Error processing SNS message");
					reject(processError);
				}
			});
		});
	}

	private async processMessage(message: SnsMessage) {
		const type = message.Type;

		if (type === "SubscriptionConfirmation") {
			logger.info(`Confirming SNS subscription for topic ${message.TopicArn}`);
			logger.info(`Subscribe URL: ${message.SubscribeURL}`);
			return;
		}

		if (type === "Notification") {
			const rawMessage = message.Message;
			let sesMessage;
			try {
				sesMessage = JSON.parse(rawMessage);
			} catch {
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

	private async handleBounce(bounce: Bounce) {
		const bounceType = bounce.bounceType;
		const bouncedRecipients = bounce.bouncedRecipients;

		logger.info(`Processing Bounce: ${bounceType}`);

		if (bounceType === "Permanent") {
			for (const recipient of bouncedRecipients) {
				const email = recipient.emailAddress;
				await this.deactivateUser(email, "Hard Bounce");
			}
		}
	}

	private async handleComplaint(complaint: Complaint) {
		const complainedRecipients = complaint.complainedRecipients;
		logger.info("Processing Complaint");

		for (const recipient of complainedRecipients) {
			const email = recipient.emailAddress;
			await this.deactivateUser(email, "Complaint");
		}
	}

	private async deactivateUser(email: string, reason: string) {
		try {
			await prisma.user.update({
				where: { email },
				data: {
					isActive: false,
				},
			});
			logger.warn(`User ${email} deactivated due to ${reason}`);
		} catch (error) {
			logger.error({ err: error, email }, `Failed to deactivate user`);
		}
	}
}

export { SnsService };
export const snsService = new SnsService();
