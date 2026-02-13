import { Request, Response } from "express";
import prisma from "../db/prisma";
import { hashPassword, verifyPassword } from "../utils/hash";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { signupSchema, loginSchema } from "../validators/auth";

export const signup = async (req: Request, res: Response): Promise<void> => {
	try {
		const validatedData = signupSchema.parse(req.body);

		const existingUser = await prisma.user.findUnique({
			where: { email: validatedData.email },
		});

		if (existingUser) {
			res.status(400).json({ error: "Email already in use" });
			return;
		}

		const passwordHash = await hashPassword(validatedData.password);

		const user = await prisma.user.create({
			data: {
				email: validatedData.email,
				passwordHash,
				gender: validatedData.gender,
			},
		});

		const accessToken = generateAccessToken(user.id);
		const refreshToken = generateRefreshToken(user.id);

		// Store hashed refresh token
		await prisma.refreshToken.create({
			data: {
				userId: user.id,
				tokenHash: await hashPassword(refreshToken), // Ideally use a faster hash for tokens, but bcrypt is fine for MVP
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			},
		});

		res.status(201).json({
			user: { id: user.id, email: user.email },
			accessToken,
			refreshToken,
		});
	} catch (error) {
		console.error("Signup error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const login = async (req: Request, res: Response): Promise<void> => {
	try {
		const validatedData = loginSchema.parse(req.body);

		const user = await prisma.user.findUnique({
			where: { email: validatedData.email },
		});

		if (!user || !user.passwordHash) {
			res.status(401).json({ error: "Invalid credentials" });
			return;
		}

		const isValidPassword = await verifyPassword(validatedData.password, user.passwordHash);

		if (!isValidPassword) {
			res.status(401).json({ error: "Invalid credentials" });
			return;
		}

		const accessToken = generateAccessToken(user.id);
		const refreshToken = generateRefreshToken(user.id);

		// Store hashed refresh token
		await prisma.refreshToken.create({
			data: {
				userId: user.id,
				tokenHash: await hashPassword(refreshToken),
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			},
		});

		await prisma.user.update({
			where: { id: user.id },
			data: { lastLogin: new Date() },
		});

		res.json({
			user: { id: user.id, email: user.email },
			accessToken,
			refreshToken,
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

import { OAuth2Client } from "google-auth-library";
import env from "../config/env";
import { googleLoginSchema } from "../validators/auth";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
	try {
		const validatedData = googleLoginSchema.parse(req.body);

		// Verify Google Token
		const ticket = await client.verifyIdToken({
			idToken: validatedData.idToken,
			audience: env.GOOGLE_CLIENT_ID,
		});

		const payload = ticket.getPayload();

		if (!payload || !payload.email) {
			res.status(401).json({ error: "Invalid Google token" });
			return;
		}

		const { email, sub: googleId, picture } = payload; // sub is the google user id

		// Check if user exists
		let user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			// Create new user
			user = await prisma.user.create({
				data: {
					email,
					isEmailVerified: true, // Google verifies emails
					// No password hash for OAuth users
				},
			});
		}

		// Link OAuth account if not already linked (idempotent)
		// Using upsert or create if not exists logic, but Prisma doesn't have createifnotexists easily on relation
		// We check via findUnique or rely on create throwing error (but we want to avoid errors).
		// Let's optimize: find unique on provider_providerAccountId composite key.

		const existingOAuth = await prisma.oAuthAccount.findUnique({
			where: {
				provider_providerAccountId: {
					provider: "google",
					providerAccountId: googleId,
				},
			},
		});

		if (!existingOAuth) {
			await prisma.oAuthAccount.create({
				data: {
					userId: user.id,
					provider: "google",
					providerAccountId: googleId,
				},
			});
		}

		const accessToken = generateAccessToken(user.id);
		const refreshToken = generateRefreshToken(user.id);

		// Store hashed refresh token
		await prisma.refreshToken.create({
			data: {
				userId: user.id,
				tokenHash: await hashPassword(refreshToken),
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			},
		});

		await prisma.user.update({
			where: { id: user.id },
			data: { lastLogin: new Date() },
		});

		res.json({
			user: { id: user.id, email: user.email, picture },
			accessToken,
			refreshToken,
		});
	} catch (error) {
		console.error("Google Login error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};
