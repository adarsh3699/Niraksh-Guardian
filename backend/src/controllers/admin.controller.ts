import { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import prisma from "../db/prisma";
import { doctorApplicationReviewSchema } from "../validators/admin.schema";
import { requireAuthenticatedUserId } from "../types/auth";
import logger from "../config/logger";
import { handleControllerError } from "../utils/controllerError";

const getRouteParam = (req: Request, key: string): string => {
	const value = req.params[key];
	return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
};

export const getDoctorApplications = async (_req: Request, res: Response) => {
	try {
		const applications = await prisma.doctorProfile.findMany({
			include: {
				user: { select: { id: true, name: true, email: true, createdAt: true, isActive: true } },
				directoryDoctor: { select: { id: true, name: true, specialization: true, isAvailable: true } },
			},
			orderBy: [{ verificationStatus: "asc" }, { createdAt: "desc" }],
		});
		return res.json({ applications });
	} catch (error) {
		handleControllerError({ error, res, logger, context: "Failed to get doctor applications" });
	}
};

export const reviewDoctorApplication = async (req: Request, res: Response) => {
	try {
		const adminId = requireAuthenticatedUserId(req, res);
		if (!adminId) return;
		const input = doctorApplicationReviewSchema.parse(req.body);
		const profileId = getRouteParam(req, "id");
		const profile = await prisma.doctorProfile.findUnique({
			where: { id: profileId },
			include: { user: true, directoryDoctor: true },
		});
		if (!profile) return res.status(404).json({ error: "Doctor application not found" });
		if (profile.userId === adminId) return res.status(400).json({ error: "You cannot review your own profile" });

		if (input.status === "REJECTED") {
			const updated = await prisma.$transaction(async (tx) => {
				const result = await tx.doctorProfile.update({
					where: { id: profile.id },
					data: {
						verificationStatus: "REJECTED",
						verificationNote: input.note || "Application needs more information",
					},
				});
				if (profile.directoryDoctorId) {
					await tx.doctor.update({
						where: { id: profile.directoryDoctorId },
						data: { isAvailable: false },
					});
				}
				await tx.patientDoctorAccess.updateMany({
					where: { doctorProfileId: profile.id, status: "ACTIVE" },
					data: { status: "REVOKED", revokedAt: new Date() },
				});
				return result;
			});
			return res.json({ profile: updated });
		}

		const requiredFields = [
			["displayName", profile.displayName],
			["licenseNumber", profile.licenseNumber],
			["specialization", profile.specialization],
			["qualification", profile.qualification],
			["experienceYears", profile.experienceYears],
			["consultationFee", profile.consultationFee],
			["city", profile.city],
			["state", profile.state],
			["bio", profile.bio],
			["contactInfo", profile.contactInfo],
			["phone", profile.phone],
		] as const;
		const missingFields: string[] = requiredFields
			.filter(([, value]) => value === null || value === undefined || value === "")
			.map(([key]) => key);
		if (profile.consultationModes.length === 0) missingFields.push("consultationModes");
		if (missingFields.length > 0) {
			return res.status(400).json({ error: `Application is missing: ${missingFields.join(", ")}` });
		}

		const result = await prisma.$transaction(async (tx) => {
			let directoryDoctorId = profile.directoryDoctorId;
			if (!directoryDoctorId) {
				const directoryDoctor = await tx.doctor.create({
					data: {
						name: profile.displayName!,
						specialization: profile.specialization!,
						qualification: profile.qualification!,
						experienceYears: profile.experienceYears!,
						consultationFee: profile.consultationFee!,
						city: profile.city!,
						state: profile.state!,
						bio: profile.bio!,
						contactInfo: profile.contactInfo!,
						phone: profile.phone!,
						tags: [profile.specialization!],
					},
				});
				directoryDoctorId = directoryDoctor.id;
			}

			const updatedProfile = await tx.doctorProfile.update({
				where: { id: profile.id },
				data: { verificationStatus: "APPROVED", verificationNote: input.note ?? null, directoryDoctorId },
				include: { directoryDoctor: true },
			});
			await tx.doctor.update({
				where: { id: directoryDoctorId },
				data: {
					name: profile.displayName!,
					specialization: profile.specialization!,
					qualification: profile.qualification!,
					experienceYears: profile.experienceYears!,
					consultationFee: profile.consultationFee!,
					city: profile.city!,
					state: profile.state!,
					bio: profile.bio!,
					contactInfo: profile.contactInfo!,
					phone: profile.phone!,
					tags: [profile.specialization!],
					isAvailable: true,
				},
			});
			return updatedProfile;
		});

		return res.json({ profile: result });
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
			return res.status(409).json({ error: "This doctor profile is already linked to a directory listing" });
		}
		handleControllerError({ error, res, logger, context: "Failed to review doctor application" });
	}
};
