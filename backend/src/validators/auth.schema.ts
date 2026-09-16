import { z } from "zod";

export const signupSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	name: z.string().optional(),
	gender: z.enum(["Male", "Female", "Other"]).optional(),
});

export const doctorSignupSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	name: z.string().trim().min(2).max(120),
	licenseNumber: z.string().trim().min(3).max(80),
	specialization: z.string().trim().min(2).max(120),
	qualification: z.string().trim().min(2).max(160),
	experienceYears: z.coerce.number().int().min(0).max(70),
	consultationFee: z.coerce.number().int().min(0).max(100000),
	city: z.string().trim().min(2).max(100),
	state: z.string().trim().min(2).max(100),
	bio: z.string().trim().min(20).max(2000),
	contactInfo: z.string().trim().min(3).max(200),
	phone: z.string().trim().min(7).max(20),
	clinicName: z.string().trim().min(2).max(160).optional(),
	clinicAddress: z.string().trim().max(500).optional(),
	consultationModes: z
		.array(z.enum(["IN_PERSON", "VIDEO", "PHONE"]))
		.min(1)
		.max(3),
});

export const doctorApplicationUpdateSchema = doctorSignupSchema.omit({ email: true, password: true });

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
