/* ------------------------------------------------------------------ */
/*  Zod validation schemas (shared with React Hook Form)              */
/* ------------------------------------------------------------------ */

import { z } from "zod";

/* — Auth — */

export const loginSchema = z.object({
	email: z.string().min(1, "Email is required").email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
	.object({
		name: z.string().min(1, "Name is required"),
		email: z.string().min(1, "Email is required").email("Invalid email address"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
		gender: z.enum(["Male", "Female", "Other"]).optional(),
	})
	.refine((d) => d.password === d.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});
export type SignupFormData = z.infer<typeof signupSchema>;

export const doctorSignupSchema = z
	.object({
		name: z.string().min(2, "Full name is required"),
		email: z.string().email("Enter a valid email"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
		licenseNumber: z.string().min(3, "License number is required"),
		specialization: z.string().min(2, "Specialization is required"),
		qualification: z.string().min(2, "Qualification is required"),
		experienceYears: z.number().int().min(0).max(70),
		consultationFee: z.number().int().min(0).max(100000),
		city: z.string().min(2, "City is required"),
		state: z.string().min(2, "State is required"),
		bio: z.string().min(20, "Tell patients at least 20 characters about your practice").max(2000),
		contactInfo: z.string().min(3, "Contact information is required").max(200),
		phone: z.string().min(7, "Enter a valid phone number").max(20),
		clinicName: z.string().optional(),
		clinicAddress: z.string().max(500).optional(),
		consultationModes: z
			.array(z.enum(["IN_PERSON", "VIDEO", "PHONE"]))
			.min(1, "Select one consultation mode"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});
export type DoctorSignupFormData = z.infer<typeof doctorSignupSchema>;
export const doctorApplicationUpdateSchema = z.object({
	name: z.string().min(2, "Full name is required"),
	licenseNumber: z.string().min(3, "License number is required"),
	specialization: z.string().min(2, "Specialization is required"),
	qualification: z.string().min(2, "Qualification is required"),
	experienceYears: z.number().int().min(0).max(70),
	consultationFee: z.number().int().min(0).max(100000),
	city: z.string().min(2, "City is required"),
	state: z.string().min(2, "State is required"),
	bio: z.string().min(20, "Tell patients at least 20 characters about your practice").max(2000),
	contactInfo: z.string().min(3, "Contact information is required").max(200),
	phone: z.string().min(7, "Enter a valid phone number").max(20),
	clinicName: z.string().optional(),
	clinicAddress: z.string().max(500).optional(),
	consultationModes: z
		.array(z.enum(["IN_PERSON", "VIDEO", "PHONE"]))
		.min(1, "Select one consultation mode"),
});
export type DoctorApplicationUpdateFormData = z.infer<typeof doctorApplicationUpdateSchema>;

export const forgotPasswordSchema = z.object({
	email: z.string().min(1, "Email is required").email("Invalid email address"),
});
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
	.object({
		token: z.string().min(1, "Reset token is required"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((d) => d.password === d.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/* — Chat — */

export const chatMessageSchema = z.object({
	content: z.string().min(1, "Message cannot be empty").max(5000, "Message too long (max 5000)"),
});
export type ChatMessageFormData = z.infer<typeof chatMessageSchema>;

/* — Symptoms — */

export const symptomSearchSchema = z.object({
	symptoms: z.array(z.string().min(1)).min(1, "Enter at least one symptom"),
	language: z.string().optional().default("en"),
});
export type SymptomSearchFormData = z.infer<typeof symptomSearchSchema>;

export const summarizeSymptomsSchema = z.object({
	chatId: z.string().min(1, "Chat ID is required"),
});
export type SummarizeSymptomsFormData = z.infer<typeof summarizeSymptomsSchema>;

/* — Profile — */

export const profileSchema = z.object({
	name: z.string().optional(),
	gender: z.enum(["Male", "Female", "Other"]).optional(),
	languagePreference: z.string().optional(),
	bloodGroup: z.string().optional(),
	allergies: z.array(z.string()).optional(),
	chronicConditions: z.array(z.string()).optional(),
	emergencyContactName: z.string().optional(),
	emergencyContactPhone: z.string().optional(),
	emergencyContactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
	city: z.string().optional(),
	state: z.string().optional(),
});
export type ProfileFormData = z.infer<typeof profileSchema>;

/* — Drug Interaction — */

export const drugInteractionSchema = z.object({
	medicines: z
		.array(z.string().min(1, "Medicine name cannot be empty"))
		.min(1, "Enter at least 1 medicine"),
});
export type DrugInteractionFormData = z.infer<typeof drugInteractionSchema>;
