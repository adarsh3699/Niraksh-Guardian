import * as express from "express";
import { doctorSignupSchema, signupSchema, loginSchema, refreshTokenSchema } from "../validators/auth.schema";
import { hashPassword, verifyPassword, hashToken } from "../utils/hash";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../services/jwt/jwt";
import { blacklistToken } from "../services/tokenBlacklist";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma";
import { Prisma } from "../generated/prisma/client";
import env from "../config/env";
import logger from "../config/logger";
import { handleControllerError } from "../utils/controllerError";
import { recordRefreshAttempt, recordRefreshFailure, recordRefreshSuccess } from "../services/authMetrics";

const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_COOKIE_SAME_SITE = env.NODE_ENV === "production" ? "none" : "lax";

type RefreshFailureCode =
	| "missing_token"
	| "invalid_request"
	| "invalid_jwt"
	| "invalid_payload"
	| "token_not_found"
	| "rotation_conflict"
	| "unexpected_error";

const rejectRefresh = (
	res: express.Response,
	code: RefreshFailureCode,
	error = "Invalid refresh token",
	context?: Record<string, unknown>,
	statusCode = 401,
	clearCookie = true
) => {
	if (clearCookie) {
		clearRefreshTokenCookie(res);
	}
	recordRefreshFailure(code);
	logger.warn(
		{
			event: "auth.refresh.failed",
			code,
			...context,
		},
		"Refresh token exchange rejected"
	);
	return res.status(statusCode).json({ error, code });
};

const setRefreshTokenCookie = (res: express.Response, token: string) => {
	res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
		httpOnly: true,
		secure: env.NODE_ENV === "production",
		sameSite: REFRESH_TOKEN_COOKIE_SAME_SITE,
		path: "/api/auth",
		maxAge: REFRESH_TOKEN_MAX_AGE_MS,
	});
};

const clearRefreshTokenCookie = (res: express.Response) => {
	res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
		httpOnly: true,
		secure: env.NODE_ENV === "production",
		sameSite: REFRESH_TOKEN_COOKIE_SAME_SITE,
		path: "/api/auth",
	});
};

const issueAuthSession = async (res: express.Response, userId: string) => {
	const accessToken = generateAccessToken(userId);
	const refreshToken = generateRefreshToken(userId);

	await prisma.refreshToken.create({
		data: {
			userId,
			tokenHash: hashToken(refreshToken),
			expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
		},
	});

	setRefreshTokenCookie(res, refreshToken);
	return accessToken;
};

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

		const accessToken = await issueAuthSession(res, user.id);

		res.status(201).json({
			message: "User created successfully",
			user: {
				id: user.id,
				email: user.email,
				name: user.name || null,
				gender: user.gender || null,
				role: user.role,
			},
			tokens: { accessToken },
		});
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Signup failed" });
	}
};

export const doctorSignup = async (req: express.Request, res: express.Response) => {
	try {
		const validatedData = doctorSignupSchema.parse(req.body);
		const existingUser = await prisma.user.findUnique({ where: { email: validatedData.email } });
		if (existingUser) return res.status(400).json({ error: "An account with this email already exists" });

		const passwordHash = await hashPassword(validatedData.password);
		const user = await prisma.$transaction(async (tx) => {
			const createdUser = await tx.user.create({
				data: {
					email: validatedData.email,
					name: validatedData.name,
					passwordHash,
					role: "DOCTOR",
				},
			});
			const directoryDoctor = await tx.doctor.create({
				data: {
					name: validatedData.name,
					specialization: validatedData.specialization,
					qualification: validatedData.qualification,
					experienceYears: validatedData.experienceYears,
					consultationFee: validatedData.consultationFee,
					city: validatedData.city,
					state: validatedData.state,
					bio: validatedData.bio,
					contactInfo: validatedData.contactInfo,
					phone: validatedData.phone,
					tags: [validatedData.specialization],
					isAvailable: false,
				},
			});

			await tx.doctorProfile.create({
				data: {
					userId: createdUser.id,
					directoryDoctorId: directoryDoctor.id,
					verificationStatus: "PENDING",
					displayName: validatedData.name,
					licenseNumber: validatedData.licenseNumber,
					specialization: validatedData.specialization,
					qualification: validatedData.qualification,
					experienceYears: validatedData.experienceYears,
					consultationFee: validatedData.consultationFee,
					city: validatedData.city,
					state: validatedData.state,
					bio: validatedData.bio,
					contactInfo: validatedData.contactInfo,
					phone: validatedData.phone,
					clinicName: validatedData.clinicName,
					clinicAddress: validatedData.clinicAddress,
					consultationModes: validatedData.consultationModes,
				},
			});
			return createdUser;
		});

		const accessToken = await issueAuthSession(res, user.id);
		return res.status(201).json({
			message: "Doctor application submitted for verification",
			applicationStatus: "PENDING",
			user: { id: user.id, email: user.email, name: user.name || null, gender: null, role: user.role },
			tokens: { accessToken },
		});
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			return res.status(409).json({ error: "Email or medical license number is already registered" });
		}
		handleControllerError({ error, res, logger, context: "Doctor signup failed" });
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

		const accessToken = await issueAuthSession(res, user.id);

		// Update last login
		await prisma.user.update({
			where: { id: user.id },
			data: { lastLogin: new Date() },
		});

		res.status(200).json({
			message: "Login successful",
			user: {
				id: user.id,
				email: user.email,
				name: user.name || null,
				gender: user.gender || null,
				role: user.role,
			},
			tokens: { accessToken },
		});
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Login failed" });
	}
};

export const refreshToken = async (req: express.Request, res: express.Response) => {
	try {
		recordRefreshAttempt();
		const parsedResult = refreshTokenSchema.safeParse(req.body ?? {});
		if (!parsedResult.success) {
			return rejectRefresh(res, "invalid_request", "Invalid refresh token request");
		}

		const parsed = parsedResult.data;
		const tokenFromBody = parsed.refreshToken;
		const tokenFromCookie = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as string | undefined;
		const incomingRefreshToken = tokenFromBody ?? tokenFromCookie;

		if (!incomingRefreshToken) {
			return rejectRefresh(res, "missing_token", "Refresh token missing");
		}

		let decoded: string | jwt.JwtPayload;
		try {
			decoded = verifyRefreshToken(incomingRefreshToken);
		} catch {
			return rejectRefresh(res, "invalid_jwt");
		}

		if (typeof decoded === "string" || !decoded.userId) {
			return rejectRefresh(res, "invalid_payload");
		}

		const tokenHash = hashToken(incomingRefreshToken);

		const storedToken = await prisma.refreshToken.findFirst({
			where: {
				userId: decoded.userId,
				tokenHash,
				revoked: false,
				expiresAt: { gt: new Date() },
			},
		});

		if (!storedToken) {
			return rejectRefresh(res, "token_not_found", "Invalid or expired refresh token", {
				userId: decoded.userId,
			});
		}

		const newAccessToken = generateAccessToken(decoded.userId);
		const newRefreshToken = generateRefreshToken(decoded.userId);
		const newRefreshTokenHash = hashToken(newRefreshToken);

		const rotated = await prisma.$transaction(async (tx) => {
			const revoked = await tx.refreshToken.updateMany({
				where: {
					id: storedToken.id,
					revoked: false,
					expiresAt: { gt: new Date() },
				},
				data: { revoked: true },
			});

			if (revoked.count !== 1) {
				return false;
			}

			await tx.refreshToken.create({
				data: {
					userId: decoded.userId,
					tokenHash: newRefreshTokenHash,
					expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
				},
			});

			return true;
		});

		if (!rotated) {
			return rejectRefresh(
				res,
				"rotation_conflict",
				"Invalid or expired refresh token",
				{
					userId: decoded.userId,
					tokenId: storedToken.id,
				},
				409,
				false
			);
		}

		setRefreshTokenCookie(res, newRefreshToken);
		recordRefreshSuccess();

		res.json({
			accessToken: newAccessToken,
		});
	} catch (error) {
		logger.error(
			{
				event: "auth.refresh.error",
				error,
			},
			"Refresh token exchange failed unexpectedly"
		);
		return rejectRefresh(res, "unexpected_error");
	}
};

export const logout = async (req: express.Request, res: express.Response) => {
	try {
		const bodyRefreshToken = (req.body?.refreshToken as string | undefined) ?? undefined;
		const cookieRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as string | undefined;
		const refreshToken = bodyRefreshToken ?? cookieRefreshToken;

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

		clearRefreshTokenCookie(res);

		res.status(200).json({ message: "Logged out successfully" });
	} catch {
		res.status(500).json({ error: "Internal Server Error" });
	}
};

import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: express.Request, res: express.Response) => {
	try {
		const { idToken, accessToken: googleAccessToken } = req.body;

		let email: string | undefined;
		let googleId: string | undefined;
		let name: string | undefined | null;

		if (idToken) {
			// Legacy: credential/id_token flow from <GoogleLogin> component
			const ticket = await client.verifyIdToken({
				idToken,
				audience: env.GOOGLE_CLIENT_ID,
			});
			const payload = ticket.getPayload();
			if (!payload || !payload.email) {
				return res.status(400).json({ error: "Invalid Google Token" });
			}
			email = payload.email;
			googleId = payload.sub;
			name = payload.name;
		} else if (googleAccessToken) {
			// New: access_token flow from useGoogleLogin hook
			const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
				headers: { Authorization: `Bearer ${googleAccessToken}` },
			});
			if (!response.ok) {
				return res.status(401).json({ error: "Invalid Google Access Token" });
			}
			const info = (await response.json()) as { email?: string; sub?: string; name?: string };
			if (!info.email || !info.sub) {
				return res.status(400).json({ error: "Could not retrieve Google user info" });
			}
			email = info.email;
			googleId = info.sub;
			name = info.name;
		} else {
			return res.status(400).json({ error: "Google token is required" });
		}

		let user = await prisma.user.findUnique({
			where: { email: email! },
		});

		if (!user) {
			// Create new user with name from Google profile
			user = await prisma.user.create({
				data: {
					email: email!,
					name: name || null,
					isEmailVerified: true, // Google emails are verified
				},
			});
		}

		// Upsert OAuth Account
		await prisma.oAuthAccount.upsert({
			where: {
				provider_providerAccountId: {
					provider: "google",
					providerAccountId: googleId!,
				},
			},
			update: {},
			create: {
				userId: user.id,
				provider: "google",
				providerAccountId: googleId!,
			},
		});

		const accessToken = await issueAuthSession(res, user.id);

		// Update last login
		await prisma.user.update({
			where: { id: user.id },
			data: { lastLogin: new Date() },
		});

		res.status(200).json({
			message: "Google login successful",
			user: {
				id: user.id,
				email: user.email,
				name: user.name || null,
				gender: user.gender || null,
				role: user.role,
			},
			tokens: { accessToken },
		});
	} catch (error) {
		logger.error({ err: error }, "Google login failed");
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
		handleControllerError({ error, res, logger, context: "Forgot password failed" });
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
		handleControllerError({ error, res, logger, context: "Reset password failed" });
	}
};
