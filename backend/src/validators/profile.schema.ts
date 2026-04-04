import { z } from "zod";

const optionalStringOrNull = z.string().trim().optional().nullable();

export const updateProfileSchema = z.object({
	name: optionalStringOrNull,
	gender: optionalStringOrNull,
	languagePreference: optionalStringOrNull,
	bloodGroup: optionalStringOrNull,
	allergies: z.array(z.string().trim()).optional(),
	chronicConditions: z.array(z.string().trim()).optional(),
	emergencyContactName: optionalStringOrNull,
	emergencyContactPhone: optionalStringOrNull,
	emergencyContactEmail: optionalStringOrNull,
	city: optionalStringOrNull,
	state: optionalStringOrNull,
});
