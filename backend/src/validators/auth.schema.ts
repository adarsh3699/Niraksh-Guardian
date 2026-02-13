import { z } from "zod";

export const signupSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	firstName: z.string().optional(), // In case we want to split name
	lastName: z.string().optional(),
	gender: z.enum(["Male", "Female", "Other"]).optional(),
});

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});

export const refreshTokenSchema = z.object({
	refreshToken: z.string(),
});

export const googleLoginSchema = z.object({
	idToken: z.string().min(1),
});
