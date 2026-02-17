import * as express from "express";
import { PrismaClient } from "../generated/prisma";
import { signupSchema, loginSchema, refreshTokenSchema } from "../validators/auth.schema";
import { ZodError } from "zod";
import { hashPassword, verifyPassword, hashToken } from "../utils/hash";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../services/jwt/jwt";
import { blacklistToken } from "../services/tokenBlacklist";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const signup = async (req: express.Request, res: express.Response) => {
	try {
		const validatedData = signupSchema.parse(req.body);

		const existingUser = await prisma.user.findUnique({
			where: { email: validatedData.email },
		});

		if (existingUser) {
			return res.status(400).json({ error: "User already exists" });
		}

		const passwordHash = await hashPassword(validatedData.password);

		const user = await prisma.user.create({
			data: {
				email: validatedData.email,
				name: validatedData.name,
				passwordHash,
				gender: validatedData.gender,
			},
		});

		// Generate tokens
		const accessToken = generateAccessToken(user.id);
		const refreshToken = generateRefreshToken(user.id);
		const refreshTokenHash = hashToken(refreshToken);

		// Store refresh token
		await prisma.refreshToken.create({
			data: {
				userId: user.id,
				tokenHash: refreshTokenHash,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			},
		});

		res.status(201).json({
			message: "User created successfully",
			user: { id: user.id, email: user.email },
			tokens: { accessToken, refreshToken },
		});
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ error: error.issues });
		}
		const message = error instanceof Error ? error.message : "Unknown error";
		res.status(500).json({ error: "Internal Server Error", details: message });
	}
};

export const login = async (req: express.Request, res: express.Response) => {
	try {
		const validatedData = loginSchema.parse(req.body);

		const user = await prisma.user.findUnique({
			where: { email: validatedData.email },
		});

		if (!user || !user.passwordHash) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const isPasswordValid = await verifyPassword(validatedData.password, user.passwordHash);

		if (!isPasswordValid) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		// Generate tokens
		const accessToken = generateAccessToken(user.id);
		const refreshToken = generateRefreshToken(user.id);
		const refreshTokenHash = hashToken(refreshToken);

		// Store refresh token
		await prisma.refreshToken.create({
			data: {
				userId: user.id,
				tokenHash: refreshTokenHash,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			},
		});

		// Update last login
		await prisma.user.update({
			where: { id: user.id },
			data: { lastLogin: new Date() },
		});

		res.status(200).json({
			message: "Login successful",
			user: { id: user.id, email: user.email },
			tokens: { accessToken, refreshToken },
		});
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ error: error.issues });
		}
		const message = error instanceof Error ? error.message : "Unknown error";
		res.status(500).json({ error: "Internal Server Error", details: message });
	}
};

export const refreshToken = async (req: express.Request, res: express.Response) => {
	try {
		const { refreshToken } = refreshTokenSchema.parse(req.body);
		const decoded = verifyRefreshToken(refreshToken);
		if (typeof decoded === "string") {
			throw new Error("Invalid token payload");
		}
		const tokenHash = hashToken(refreshToken);

		const storedToken = await prisma.refreshToken.findFirst({
			where: {
				userId: decoded.userId,
				tokenHash,
				revoked: false,
				expiresAt: { gt: new Date() },
			},
		});

		if (!storedToken) {
			return res.status(401).json({ error: "Invalid or expired refresh token" });
		}

		// Rotate tokens
		// Revoke used token
		await prisma.refreshToken.update({
			where: { id: storedToken.id },
			data: { revoked: true },
		});

		// Generate new tokens
		const newAccessToken = generateAccessToken(decoded.userId);
		const newRefreshToken = generateRefreshToken(decoded.userId);
		const newRefreshTokenHash = hashToken(newRefreshToken);

		// Store new refresh token
		await prisma.refreshToken.create({
			data: {
				userId: decoded.userId,
				tokenHash: newRefreshTokenHash,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			},
		});

		res.json({
			accessToken: newAccessToken,
			refreshToken: newRefreshToken,
		});
	} catch {
		res.status(401).json({ error: "Invalid refresh token" });
	}
};

export const logout = async (req: express.Request, res: express.Response) => {
	try {
		const { refreshToken } = req.body;
		if (refreshToken) {
			const tokenHash = hashToken(refreshToken);
			await prisma.refreshToken.updateMany({
				where: { tokenHash },
				data: { revoked: true },
			});
		}

		// Blacklist the access token in Redis
		const authHeader = req.headers.authorization;
		if (authHeader?.startsWith("Bearer ")) {
			const accessToken = authHeader.split(" ")[1];
			const decoded = jwt.decode(accessToken) as jwt.JwtPayload | null;
			if (decoded?.exp) {
				const ttl = decoded.exp - Math.floor(Date.now() / 1000);
				if (ttl > 0) {
					await blacklistToken(accessToken, ttl);
				}
			}
		}

		res.status(200).json({ message: "Logged out successfully" });
	} catch {
		res.status(500).json({ error: "Internal Server Error" });
	}
};

import { OAuth2Client } from "google-auth-library";
import env from "../config/env";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: express.Request, res: express.Response) => {
	try {
		const { idToken } = req.body; // Basic validation, schema validation recommended in real flow

		const ticket = await client.verifyIdToken({
			idToken,
			audience: env.GOOGLE_CLIENT_ID,
		});
		const payload = ticket.getPayload();

		if (!payload || !payload.email) {
			return res.status(400).json({ error: "Invalid Google Token" });
		}

		const { email, sub: googleId } = payload;

		let user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			// Create new user
			user = await prisma.user.create({
				data: {
					email,
					isEmailVerified: true, // Google emails are verified
				},
			});
		}

		// Upsert OAuth Account
		await prisma.oAuthAccount.upsert({
			where: {
				provider_providerAccountId: {
					provider: "google",
					providerAccountId: googleId,
				},
			},
			update: {},
			create: {
				userId: user.id,
				provider: "google",
				providerAccountId: googleId,
			},
		});

		// Generate tokens
		const accessToken = generateAccessToken(user.id);
		const refreshToken = generateRefreshToken(user.id);
		const refreshTokenHash = hashToken(refreshToken);

		// Store refresh token
		await prisma.refreshToken.create({
			data: {
				userId: user.id,
				tokenHash: refreshTokenHash,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			},
		});

		// Update last login
		await prisma.user.update({
			where: { id: user.id },
			data: { lastLogin: new Date() },
		});

		res.status(200).json({
			message: "Google login successful",
			user: { id: user.id, email: user.email },
			tokens: { accessToken, refreshToken },
		});
	} catch (error) {
		console.error("Google Login Error:", error);
		res.status(401).json({ error: "Google Authentication Failed" });
	}
};

import { forgotPasswordSchema, resetPasswordSchema } from "../validators/auth.schema";
import { emailService } from "../services/email/email.service";
import crypto from "crypto";

export const forgotPassword = async (req: express.Request, res: express.Response) => {
	try {
		const { email } = forgotPasswordSchema.parse(req.body);

		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			// Fail silently to prevent email enumeration
			return res.status(200).json({ message: "If an account exists, a reset link has been sent." });
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(32).toString("hex");
		const resetTokenHash = hashToken(resetToken);
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		// Store/Update token
		// Revoke any existing tokens
		await prisma.passwordResetToken.deleteMany({
			where: { userId: user.id },
		});

		// Create new token
		await prisma.passwordResetToken.create({
			data: {
				userId: user.id,
				tokenHash: resetTokenHash,
				expiresAt,
			},
		});

		// Send email
		await emailService.sendPasswordResetEmail(email, resetToken);

		res.status(200).json({ message: "If an account exists, a reset link has been sent." });
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ error: error.issues });
		}
		console.error("Forgot Password Error:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};

export const resetPassword = async (req: express.Request, res: express.Response) => {
	try {
		const { token, password } = resetPasswordSchema.parse(req.body);
		const tokenHash = hashToken(token);

		const resetTokenEntry = await prisma.passwordResetToken.findFirst({
			where: { tokenHash },
		});

		if (!resetTokenEntry || resetTokenEntry.expiresAt < new Date()) {
			return res.status(400).json({ error: "Invalid or expired token" });
		}

		// Update password
		const passwordHash = await hashPassword(password);
		await prisma.user.update({
			where: { id: resetTokenEntry.userId },
			data: { passwordHash },
		});

		// Delete token
		await prisma.passwordResetToken.delete({
			where: { id: resetTokenEntry.id },
		});

		res.status(200).json({ message: "Password reset successfully" });
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ error: error.issues });
		}
		console.error("Reset Password Error:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
};
