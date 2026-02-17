import nodemailer from "nodemailer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import env from "../../config/env";
import pino from "pino";

const logger = pino({ name: "email-service" });

class EmailService {
	private transporter: nodemailer.Transporter | null = null;
	private senderEmail: string;

	constructor() {
		this.senderEmail = process.env.SENDER_EMAIL || "niraksh-guardian@bhemu.in";

		if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_REGION) {
			const ses = new SESv2Client({
				region: env.AWS_REGION,
				credentials: {
					accessKeyId: env.AWS_ACCESS_KEY_ID,
					secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
				},
			});

			this.transporter = nodemailer.createTransport({
				SES: { sesClient: ses, aws: { SendEmailCommand } },
			} as unknown as nodemailer.TransportOptions);

			logger.info("AWS SES Email Transporter initialized (Nodemailer + SESv2)");
		} else {
			logger.warn("AWS SES credentials not found. Email sending will be mocked.");
		}
	}

	private getResetEmailTemplate(resetLink: string): string {
		return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; }
          .footer { margin-top: 20px; font-size: 0.8em; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
          <p>To reset your password, click the button below:</p>
          <p><a href="${resetLink}" class="button">Reset Password</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p>${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Niraksh-Guardian. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
	}

	async sendPasswordResetEmail(email: string, token: string): Promise<void> {
		const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
		const htmlBody = this.getResetEmailTemplate(resetLink);

		if (this.transporter) {
			try {
				const info = await this.transporter.sendMail({
					from: `"Niraksh Guardian" <${this.senderEmail}>`,
					to: email,
					subject: "Password Reset Request - Niraksh Guardian",
					html: htmlBody,
					text: `Reset your password using this link: ${resetLink}\nThis link will expire in 1 hour.`,
				});

				logger.info(`Password reset email sent to ${email}, MessageId: ${info.messageId}`);
			} catch (error) {
				logger.error(error, "Failed to send email via SES");
				if (env.NODE_ENV === "development") {
					logger.warn("Falling back to mock email in development mode due to SES error.");
					logger.info(`[MOCK] Password reset email would be sent to: ${email}`);
					logger.info(`[MOCK] Reset Link: ${resetLink}`);
					return;
				}
				throw new Error("Failed to send email");
			}
		} else {
			// Mock sending
			logger.info(`[MOCK] Password reset email would be sent to: ${email}`);
			logger.info(`[MOCK] Reset Link: ${resetLink}`);
			logger.info(`[MOCK] Token: ${token}`);
		}
	}
}

export const emailService = new EmailService();
