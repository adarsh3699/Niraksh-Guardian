import { z } from "zod";

export const signupSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	name: z.string().optional(),
	gender: z.enum(["Male", "Female", "Other"]).optional(),
});

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});

export const refreshTokenSchema = z.object({
	refreshToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
	email: z.string().email(),
});

export const resetPasswordSchema = z.object({
	token: z.string(),
	password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const googleLoginSchema = z.object({
	idToken: z.string().min(1),
});
