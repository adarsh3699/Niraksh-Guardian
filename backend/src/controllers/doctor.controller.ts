import { Request, Response } from "express";
import { PrismaClient, Prisma } from "../generated/prisma";
import { getDoctorsSchema } from "../validators/doctor.schema";
import { ZodError } from "zod";
import logger from "../config/logger";

const prisma = new PrismaClient();

export const getDoctors = async (req: Request, res: Response) => {
	try {
		const { search, specialization, location, page, limit } = getDoctorsSchema.parse({ query: req.query }).query;

		const skip = (page - 1) * limit;

		const where: Prisma.DoctorWhereInput = {
			isAvailable: true,
		};

		if (specialization) {
			where.specialization = { contains: specialization, mode: "insensitive" };
		}

		if (location) {
			where.location = { contains: location, mode: "insensitive" };
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ specialization: { contains: search, mode: "insensitive" } },
				{ location: { contains: search, mode: "insensitive" } },
				{ bio: { contains: search, mode: "insensitive" } },
			];
		}

		const [doctors, total] = await Promise.all([
			prisma.doctor.findMany({
				where,
				orderBy: { name: "asc" },
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
