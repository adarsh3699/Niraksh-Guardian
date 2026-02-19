import { Request, Response } from "express";
import { Prisma } from "../generated/prisma";
import prisma from "../db/prisma";
import { getDoctorsSchema } from "../validators/doctor.schema";
import { ZodError } from "zod";
import logger from "../config/logger";

const sortFieldMap: Record<string, string> = {
	name: "name",
	experience: "experienceYears",
	fee: "consultationFee",
	rating: "rating",
};

export const getDoctors = async (req: Request, res: Response) => {
	try {
		const { search, specialization, city, state, minFee, maxFee, sortBy, order, page, limit } =
			getDoctorsSchema.parse({
				query: req.query,
			}).query;

		// Support comma-separated multiple specializations e.g. ?specialization=Cardiologist,Neurologist
		const specializationList = specialization
			? specialization
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean)
			: [];

		const skip = (page - 1) * limit;

		const where: Prisma.DoctorWhereInput = {
			isAvailable: true,
		};

		if (specializationList.length === 1) {
			where.specialization = { contains: specializationList[0], mode: "insensitive" };
		} else if (specializationList.length > 1) {
			where.OR = [
				...specializationList.map((s) => ({
					specialization: { contains: s, mode: "insensitive" as const },
				})),
			];
		}

		if (city) {
			where.city = { contains: city, mode: "insensitive" };
		}

		if (state) {
			where.state = { contains: state, mode: "insensitive" };
		}

		if (minFee !== undefined || maxFee !== undefined) {
			where.consultationFee = {
				...(minFee !== undefined && { gte: minFee }),
				...(maxFee !== undefined && { lte: maxFee }),
			};
		}

		if (search) {
			const searchConditions: Prisma.DoctorWhereInput[] = [
				{ name: { contains: search, mode: "insensitive" } },
				{ specialization: { contains: search, mode: "insensitive" } },
				{ city: { contains: search, mode: "insensitive" } },
				{ state: { contains: search, mode: "insensitive" } },
				{ bio: { contains: search, mode: "insensitive" } },
				{ tags: { has: search } },
			];

			// Merge with existing OR (multi-specialization) if present
			if (where.OR) {
				where.AND = [{ OR: where.OR as Prisma.DoctorWhereInput[] }, { OR: searchConditions }];
				delete where.OR;
			} else {
				where.OR = searchConditions;
			}
		}

		const orderByField = sortFieldMap[sortBy || "rating"] || "rating";

		const [doctors, total] = await Promise.all([
			prisma.doctor.findMany({
				where,
				orderBy: { [orderByField]: order || "desc" },
				skip,
				take: limit,
			}),
			prisma.doctor.count({ where }),
		]);

		res.json({
			data: doctors,
			meta: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		if (error instanceof ZodError) {
			return res.status(400).json({ error: error.issues });
		}
		logger.error({ err: error }, "Failed to get doctors");
		res.status(500).json({ error: "Internal Server Error" });
	}
};
