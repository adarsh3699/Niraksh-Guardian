import { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
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

/* ------------------------------------------------------------------ */
/*  Relevance scoring                                                  */
/* ------------------------------------------------------------------ */

interface ScoredDoctor {
	[key: string]: unknown;
	_relevanceScore: number;
	_isNearby: boolean;
}

/**
 * Computes a holistic relevance score for a doctor given:
 * - matchTagsList: keywords derived from symptom analysis possibleConditions
 * - userCity / userState: for proximity boosting
 *
 * Score breakdown (higher = better):
 *   Tag match:   +10 pts per matching tag (case-insensitive substring)
 *   City match:  +50 pts (same city as user)
 *   State match: +20 pts (same state as user, city may differ)
 *   Rating:      rating * 3  (0–15 pts)
 *   Experience:  min(years, 20) / 2  (0–10 pts)
 *   Fee (lower): (10000 - fee) / 1000  (rough inverse, no hard cap)
 */
function scoreDoctor(
	doctor: {
		tags: string[];
		city: string;
		state: string;
		rating: number;
		experienceYears: number;
		consultationFee: number;
	},
	matchTagsList: string[],
	userCity: string | undefined,
	userState: string | undefined
): { score: number; isNearby: boolean } {
	let score = 0;

	// Tag match score
	if (matchTagsList.length > 0) {
		const doctorTagsLower = doctor.tags.map((t) => t.toLowerCase());
		for (const keyword of matchTagsList) {
			const kw = keyword.toLowerCase();
			if (doctorTagsLower.some((t) => t.includes(kw) || kw.includes(t))) {
				score += 10;
			}
		}
	}

	// Location score
	const cityMatch = !!userCity && doctor.city.toLowerCase() === userCity.toLowerCase();
	const stateMatch = !!userState && doctor.state.toLowerCase() === userState.toLowerCase();

	if (cityMatch) score += 50;
	else if (stateMatch) score += 20;

	// Quality signals
	score += doctor.rating * 3;
	score += Math.min(doctor.experienceYears, 20) / 2;
	score += (10000 - doctor.consultationFee) / 1000;

	return { score, isNearby: cityMatch };
}

export const getDoctors = async (req: Request, res: Response) => {
	try {
		const {
			search,
			specialization,
			city,
			state,
			minFee,
			maxFee,
			sortBy,
			order,
			page,
			limit,
			matchTags,
			userCity,
			userState,
		} = getDoctorsSchema.parse({ query: req.query }).query;

		// Support comma-separated multiple specializations e.g. ?specialization=Cardiologist,Neurologist
		const specializationList = specialization
			? specialization
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean)
			: [];

		// Parse matchTags into keyword array
		const matchTagsList = matchTags
			? matchTags
					.split(",")
					.map((t) => t.trim())
					.filter(Boolean)
			: [];

		// Use relevance sort when matchTags or user location is provided
		const useRelevanceSort = matchTagsList.length > 0 || !!userCity || !!userState;

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
			// Split into meaningful words — strip parentheses, punctuation, and noise words
			const NOISE_WORDS = new Set([
				"a",
				"an",
				"the",
				"of",
				"in",
				"on",
				"and",
				"or",
				"for",
				"to",
				"with",
				"by",
				"is",
				"it",
			]);
			const words = search
				.replace(/[()[\]{},;:'"]/g, " ") // strip brackets & punctuation
				.split(/\s+/)
				.map((w) => w.trim())
				.filter((w) => w.length >= 2 && !NOISE_WORDS.has(w.toLowerCase()));

			if (words.length > 0) {
				// For each word, create OR conditions across all searchable fields
				const searchConditions: Prisma.DoctorWhereInput[] = words.flatMap((word) => [
					{ name: { contains: word, mode: "insensitive" as const } },
					{ specialization: { contains: word, mode: "insensitive" as const } },
					{ city: { contains: word, mode: "insensitive" as const } },
					{ state: { contains: word, mode: "insensitive" as const } },
					{ bio: { contains: word, mode: "insensitive" as const } },
					{ tags: { has: word } },
					// Also try lowercase tag match
					{ tags: { has: word.toLowerCase() } },
				]);

				// Merge with existing OR (multi-specialization) if present
				if (where.OR) {
					where.AND = [{ OR: where.OR as Prisma.DoctorWhereInput[] }, { OR: searchConditions }];
					delete where.OR;
				} else {
					where.OR = searchConditions;
				}
			}
		}

		/* ---- Relevance sort (in-memory) ---- */
		if (useRelevanceSort) {
			// Fetch all matching doctors (no DB pagination — score/sort in memory)
			const allDoctors = await prisma.doctor.findMany({ where });
			const total = allDoctors.length;

			const scored: ScoredDoctor[] = allDoctors.map((d) => {
				const { score, isNearby } = scoreDoctor(d, matchTagsList, userCity, userState);
				return { ...d, _relevanceScore: score, _isNearby: isNearby };
			});

			// Sort by relevance score desc, then rating desc as tie-breaker
			scored.sort((a, b) => {
				const diff = (b._relevanceScore as number) - (a._relevanceScore as number);
				if (diff !== 0) return diff;
				return (b.rating as number) - (a.rating as number);
			});

			const paginated = scored.slice(skip, skip + limit);

			return res.json({
				data: paginated,
				meta: {
					total,
					page,
					limit,
					pages: Math.ceil(total / limit),
				},
			});
		}

		/* ---- Standard DB sort ---- */
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
