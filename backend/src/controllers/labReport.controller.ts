import { Request, Response } from "express";
import { randomUUID, randomBytes } from "crypto";
import prisma from "../db/prisma";
import logger from "../config/logger";
import { deleteFile, uploadFile } from "../services/cloudinary/cloudinary";
import { analyzeLabReportFile } from "../services/ai/labReportAnalysis";
import { requireAuthenticatedUserId } from "../types/auth";
import { handleControllerError } from "../utils/controllerError";
import { addNoteRequestSchema } from "../validators/labReport.schema";
import { generateLabReportPDF } from "../utils/pdfGenerator";
import { generateLabReportCSV } from "../utils/csvGenerator";
import { populateTrendDataBatch } from "../utils/trendDataPopulator";
import env from "../config/env";

type LabAnalysisJobStatus = "queued" | "processing" | "completed" | "failed";

interface LabAnalysisJob {
	id: string;
	userId: string;
	status: LabAnalysisJobStatus;
	reportId: string | null;
	error: string | null;
	createdAt: number;
	updatedAt: number;
}

// Type for Prisma report with components (to avoid 'any' types)
interface PrismaLabReportWithComponents {
	id: string;
	fileName: string;
	overallSummary: string | null;
	overallRisk: string;
	abnormalCount: number;
	totalCount: number;
	createdAt: Date;
	components: Array<{
		id: string;
		componentName: string;
		observedValue: number | null;
		observedRaw: string | null;
		unit: string | null;
		referenceMin: number | null;
		referenceMax: number | null;
		status: string;
		category: string | null;
	}>;
}

const labAnalysisJobs = new Map<string, LabAnalysisJob>();
const JOB_TTL_MS = 30 * 60 * 1000;

function cleanupExpiredJobs() {
	const now = Date.now();
	for (const [jobId, job] of labAnalysisJobs.entries()) {
		if (now - job.updatedAt > JOB_TTL_MS) {
			labAnalysisJobs.delete(jobId);
		}
	}
}

function upsertJob(jobId: string, patch: Partial<LabAnalysisJob>) {
	const current = labAnalysisJobs.get(jobId);
	if (!current) return;
	labAnalysisJobs.set(jobId, {
		...current,
		...patch,
		updatedAt: Date.now(),
	});
}

function getAuthorizedJob(jobId: string, userId: string): LabAnalysisJob | null {
	const job = labAnalysisJobs.get(jobId);
	if (!job || job.userId !== userId) return null;
	return job;
}

async function processLabAnalysisJob(
	jobId: string,
	userId: string,
	fileBuffer: Buffer,
	mime: string,
	originalName: string
) {
	upsertJob(jobId, { status: "processing" });

	try {
		const [{ url, publicId }, analysis] = await Promise.all([
			uploadFile(fileBuffer, "niraksh_lab_reports", "auto"),
			analyzeLabReportFile(fileBuffer, mime),
		]);

		// Create the report with all extended component data from Gemini
		const report = await prisma.labReport.create({
			data: {
				userId,
				fileUrl: url,
				filePublicId: publicId,
				fileName: originalName || "lab-report",
				mimeType: mime,
				extractedText: analysis.extractedText,
				overallSummary: analysis.overallSummary,
				overallRisk: analysis.overallRisk,
				abnormalCount: analysis.abnormalCount,
				totalCount: analysis.totalCount,
				components: {
					create: analysis.components.map((c) => ({
						componentName: c.componentName,
						observedValue: c.observedValue,
						observedRaw: c.observedRaw,
						unit: c.unit,
						referenceMin: c.referenceMin,
						referenceMax: c.referenceMax,
						status: c.status,
						effectSummary: c.effectSummary,
						riskTag: c.riskTag,
						confidence: c.confidence,
						sourceSnippet: c.sourceSnippet,
						// Extended fields from enhanced Gemini prompt
						category: c.category,
						aiInsight: c.aiInsight,
						urgency: c.urgency,
						symptomConnections: c.symptomConnections,
						relatedConditions: c.relatedConditions,
						whatToDoNext: c.whatToDoNext,
					})),
				},
			},
			include: {
				components: {
					select: {
						id: true,
						componentName: true,
					},
				},
			},
		});

		// Type assertion needed due to Prisma Accelerate extension affecting type inference
		const reportWithComponents = report as unknown as PrismaLabReportWithComponents;

		// Populate trend data for all components in batch

		const componentNames = reportWithComponents.components.map((c) => c.componentName);
		const trendMap = await populateTrendDataBatch(componentNames, userId, reportWithComponents.id);

		// Update each component with its trend data
		const updatePromises = reportWithComponents.components.map((component) => {
			const trend = trendMap.get(component.componentName) || [];
			return prisma.labReportComponent.update({
				where: { id: component.id },
				data: { trend },
			});
		});

		await Promise.all(updatePromises);

		upsertJob(jobId, { status: "completed", reportId: reportWithComponents.id, error: null });
	} catch (error) {
		logger.error({ err: error, jobId }, "Background lab analysis job failed");
		upsertJob(jobId, {
			status: "failed",
			error: error instanceof Error ? error.message : "Failed to analyze lab report",
		});
	}
}

export const analyzeLabReportController = async (req: Request, res: Response) => {
	try {
		cleanupExpiredJobs();

		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const file = req.file;
		if (!file) {
			return res.status(400).json({ error: "Lab report file is required" });
		}

		const mime = file.mimetype || "application/octet-stream";
		const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
		if (!allowed.includes(mime)) {
			return res.status(400).json({ error: "Unsupported file type. Upload PDF or image." });
		}

		const jobId = randomUUID();
		const now = Date.now();
		labAnalysisJobs.set(jobId, {
			id: jobId,
			userId,
			status: "queued",
			reportId: null,
			error: null,
			createdAt: now,
			updatedAt: now,
		});

		void processLabAnalysisJob(jobId, userId, file.buffer, mime, file.originalname || "lab-report");

		return res.status(202).json({
			message: "Lab report analysis queued",
			jobId,
			status: "queued",
		});
	} catch (error) {
		handleControllerError({
			error,
			res,
			logger,
			context: "Failed to analyze lab report",
			internalErrorMessage: "Failed to analyze lab report",
		});
		return;
	}
};

export const getLabReportJobStatusController = async (req: Request, res: Response) => {
	try {
		cleanupExpiredJobs();

		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
		if (!jobId) return res.status(400).json({ error: "Invalid job id" });

		const job = labAnalysisJobs.get(jobId);
		if (!job || job.userId !== userId) {
			return res.status(404).json({ error: "Lab analysis job not found" });
		}

		return res.status(200).json({
			jobId: job.id,
			status: job.status,
			reportId: job.reportId,
			error: job.error,
			createdAt: new Date(job.createdAt).toISOString(),
			updatedAt: new Date(job.updatedAt).toISOString(),
		});
	} catch (error) {
		handleControllerError({
			error,
			res,
			logger,
			context: "Failed to get lab analysis job status",
			internalErrorMessage: "Failed to get lab analysis job status",
		});
		return;
	}
};

export const streamLabReportJobStatusController = async (req: Request, res: Response) => {
	try {
		cleanupExpiredJobs();

		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
		if (!jobId) {
			return res.status(400).json({ error: "Invalid job id" });
		}

		const initialJob = getAuthorizedJob(jobId, userId);
		if (!initialJob) {
			return res.status(404).json({ error: "Lab analysis job not found" });
		}

		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache, no-transform");
		res.setHeader("Connection", "keep-alive");
		res.flushHeaders?.();

		const writeJob = (job: LabAnalysisJob) => {
			res.write(
				`data: ${JSON.stringify({
					jobId: job.id,
					status: job.status,
					reportId: job.reportId,
					error: job.error,
					updatedAt: new Date(job.updatedAt).toISOString(),
				})}\n\n`
			);
		};

		writeJob(initialJob);

		let lastStatus = initialJob.status;
		const heartbeat = setInterval(() => {
			res.write(": keepalive\n\n");
		}, 15000);

		const watcher = setInterval(() => {
			const job = getAuthorizedJob(jobId, userId);
			if (!job) {
				res.write(`data: ${JSON.stringify({ jobId, status: "failed", error: "Job not found" })}\n\n`);
				clearInterval(watcher);
				clearInterval(heartbeat);
				res.end();
				return;
			}

			if (job.status !== lastStatus) {
				lastStatus = job.status;
				writeJob(job);
			}

			if (job.status === "completed" || job.status === "failed") {
				clearInterval(watcher);
				clearInterval(heartbeat);
				res.end();
			}
		}, 1000);

		req.on("close", () => {
			clearInterval(watcher);
			clearInterval(heartbeat);
		});
	} catch (error) {
		if (res.headersSent) {
			logger.error({ err: error }, "Failed to stream lab analysis job status");
			res.end();
			return;
		}
		handleControllerError({
			error,
			res,
			logger,
			context: "Failed to stream lab analysis job status",
			internalErrorMessage: "Failed to stream lab analysis job status",
		});
	}
};

export const listLabReportsController = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const reports = await prisma.labReport.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				fileName: true,
				fileUrl: true,
				overallRisk: true,
				abnormalCount: true,
				totalCount: true,
				createdAt: true,
			},
		});

		return res.status(200).json(reports);
	} catch (error) {
		handleControllerError({
			error,
			res,
			logger,
			context: "Failed to list lab reports",
			internalErrorMessage: "Failed to list lab reports",
		});
		return;
	}
};

export const getLabReportController = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
		if (!id) return res.status(400).json({ error: "Invalid report id" });
		const report = await prisma.labReport.findFirst({
			where: { id, userId },
			include: {
				components: {
					orderBy: [{ status: "asc" }, { componentName: "asc" }],
				},
			},
		});

		if (!report) return res.status(404).json({ error: "Lab report not found" });
		return res.status(200).json(report);
	} catch (error) {
		handleControllerError({
			error,
			res,
			logger,
			context: "Failed to fetch lab report detail",
			internalErrorMessage: "Failed to fetch lab report detail",
		});
		return;
	}
};

export const deleteLabReportController = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
		if (!id) return res.status(400).json({ error: "Invalid report id" });

		const report = await prisma.labReport.findFirst({
			where: { id, userId },
			select: { id: true, filePublicId: true },
		});

		if (!report) {
			return res.status(404).json({ error: "Lab report not found" });
		}

		if (report.filePublicId) {
			try {
				await deleteFile(report.filePublicId);
			} catch (error) {
				logger.error({ err: error, reportId: report.id }, "Failed to delete cloud file for lab report");
			}
		}

		await prisma.labReport.delete({ where: { id: report.id } });
		return res.status(200).json({ message: "Lab report deleted successfully" });
	} catch (error) {
		handleControllerError({
			error,
			res,
			logger,
			context: "Failed to delete lab report",
			internalErrorMessage: "Failed to delete lab report",
		});
		return;
	}
};

export const addLabReportNoteController = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
		if (!id) return res.status(400).json({ error: "Invalid report id" });

		// Validate request body
		const validation = addNoteRequestSchema.safeParse(req.body);
		if (!validation.success) {
			return res.status(400).json({
				error: "Validation failed",
				details: validation.error.issues,
			});
		}

		const { componentId, note } = validation.data;

		// Check report ownership by verifying the component belongs to a report owned by the user
		const component = await prisma.labReportComponent.findFirst({
			where: {
				id: componentId,
				report: {
					userId,
				},
			},
			select: {
				id: true,
				reportId: true,
			},
		});

		if (!component) {
			return res.status(404).json({ error: "Component not found or access denied" });
		}

		// Verify the report ID matches
		if (component.reportId !== id) {
			return res.status(400).json({ error: "Component does not belong to this report" });
		}

		// Create the note
		const createdNote = await prisma.labReportNote.create({
			data: {
				componentId,
				note,
			},
			select: {
				id: true,
				componentId: true,
				note: true,
				createdAt: true,
			},
		});

		return res.status(200).json(createdNote);
	} catch (error) {
		handleControllerError({
			error,
			res,
			logger,
			context: "Failed to add lab report note",
			internalErrorMessage: "Failed to add lab report note",
		});
		return;
	}
};

export const deleteLabReportNoteController = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
		const noteId = Array.isArray(req.params.noteId) ? req.params.noteId[0] : req.params.noteId;

		if (!id) return res.status(400).json({ error: "Invalid report id" });
		if (!noteId) return res.status(400).json({ error: "Invalid note id" });

		// Verify report ownership through the note's component relationship
		const note = await prisma.labReportNote.findFirst({
			where: {
				id: noteId,
				component: {
					report: {
						id,
						userId,
					},
				},
			},
			select: {
				id: true,
			},
		});

		if (!note) {
			return res.status(404).json({ error: "Note not found or access denied" });
		}

		// Delete the note
		await prisma.labReportNote.delete({
			where: { id: noteId },
		});

		return res.status(200).json({ message: "Note deleted successfully" });
	} catch (error) {
		handleControllerError({
			error,
			res,
			logger,
			context: "Failed to delete lab report note",
			internalErrorMessage: "Failed to delete lab report note",
		});
		return;
	}
};

export const exportLabReportPDFController = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
		if (!id) return res.status(400).json({ error: "Invalid report id" });

		// Fetch the report with components
		const report = await prisma.labReport.findFirst({
			where: { id, userId },
			include: {
				components: {
					orderBy: [{ status: "asc" }, { componentName: "asc" }],
				},
			},
		});

		if (!report) {
			return res.status(404).json({ error: "Lab report not found" });
		}

		// Type assertion needed due to Prisma Accelerate extension affecting type inference
		const reportWithComponents = report as unknown as PrismaLabReportWithComponents;

		// Generate PDF with the report data
		const pdfBuffer = await generateLabReportPDF({
			id: reportWithComponents.id,
			fileName: reportWithComponents.fileName,
			overallSummary: reportWithComponents.overallSummary,
			overallRisk: reportWithComponents.overallRisk,
			abnormalCount: reportWithComponents.abnormalCount,
			totalCount: reportWithComponents.totalCount,
			createdAt: reportWithComponents.createdAt,
			components: reportWithComponents.components.map((c) => ({
				componentName: c.componentName,
				observedValue: c.observedValue,
				observedRaw: c.observedRaw,
				unit: c.unit,
				referenceMin: c.referenceMin,
				referenceMax: c.referenceMax,
				status: c.status,
			})),
		});

		// Set headers for PDF download
		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `attachment; filename="lab-report-${report.id}.pdf"`);
		res.setHeader("Content-Length", pdfBuffer.length);

		// Send PDF buffer
		return res.send(pdfBuffer);
	} catch (error) {
		handleControllerError({
			error,
			res,
			logger,
			context: "Failed to export lab report as PDF",
			internalErrorMessage: "Failed to export lab report as PDF",
		});
		return;
	}
};

export const exportLabReportCSVController = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
		if (!id) return res.status(400).json({ error: "Invalid report id" });

		// Fetch the report with components
		const report = await prisma.labReport.findFirst({
			where: { id, userId },
			include: {
				components: {
					orderBy: [{ status: "asc" }, { componentName: "asc" }],
				},
			},
		});

		if (!report) {
			return res.status(404).json({ error: "Lab report not found" });
		}

		// Type assertion needed due to Prisma Accelerate extension affecting type inference
		const reportWithComponents = report as unknown as PrismaLabReportWithComponents;

		// Generate CSV with the report data
		const csvString = generateLabReportCSV({
			components: reportWithComponents.components.map((c) => ({
				componentName: c.componentName,
				observedValue: c.observedValue,
				observedRaw: c.observedRaw,
				unit: c.unit,
				referenceMin: c.referenceMin,
				referenceMax: c.referenceMax,
				status: c.status,
				category: c.category,
			})),
		});

		// Set headers for CSV download
		res.setHeader("Content-Type", "text/csv");
		res.setHeader("Content-Disposition", `attachment; filename="lab-report-${report.id}.csv"`);
		res.setHeader("Content-Length", Buffer.byteLength(csvString));

		// Send CSV string
		return res.send(csvString);
	} catch (error) {
		handleControllerError({
			error,
			res,
			logger,
			context: "Failed to export lab report as CSV",
			internalErrorMessage: "Failed to export lab report as CSV",
		});
		return;
	}
};

export const shareLabReportController = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
		if (!id) return res.status(400).json({ error: "Invalid report id" });

		// Verify report ownership
		const report = await prisma.labReport.findFirst({
			where: { id, userId },
			select: { id: true },
		});

		if (!report) {
			return res.status(404).json({ error: "Lab report not found" });
		}

		// Generate secure random token (32 bytes hex)
		const token = randomBytes(32).toString("hex");

		// Set expiration to 7 days from now
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		// Create LabReportShare record
		await prisma.labReportShare.create({
			data: {
				reportId: id,
				token,
				expiresAt,
			},
		});

		// Generate share link
		const shareLink = `${env.FRONTEND_URL}/shared/lab/${token}`;

		return res.status(200).json({
			shareLink,
			expiresAt: expiresAt.toISOString(),
		});
	} catch (error) {
		handleControllerError({
			error,
			res,
			logger,
			context: "Failed to generate share link for lab report",
			internalErrorMessage: "Failed to generate share link for lab report",
		});
		return;
	}
};

export const getPreviousLabReportController = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
		if (!id) return res.status(400).json({ error: "Invalid report id" });

		// Fetch current report to get createdAt timestamp
		const currentReport = await prisma.labReport.findFirst({
			where: { id, userId },
			select: { createdAt: true },
		});

		if (!currentReport) {
			return res.status(404).json({ error: "Report not found" });
		}

		// Query for most recent report before current report's createdAt
		const previousReport = await prisma.labReport.findFirst({
			where: {
				userId,
				createdAt: { lt: currentReport.createdAt },
			},
			include: {
				components: {
					orderBy: [{ status: "asc" }, { componentName: "asc" }],
				},
			},
			orderBy: { createdAt: "desc" },
		});

		if (!previousReport) {
			return res.status(404).json({ error: "No previous report found" });
		}

		// Type assertion needed due to Prisma Accelerate extension affecting type inference
		const reportWithComponents = previousReport as unknown as PrismaLabReportWithComponents;

		// Return reportId, components array, and createdAt
		return res.status(200).json({
			reportId: reportWithComponents.id,
			components: reportWithComponents.components,
			createdAt: reportWithComponents.createdAt,
		});
	} catch (error) {
		handleControllerError({
			error,
			res,
			logger,
			context: "Failed to fetch previous lab report",
			internalErrorMessage: "Failed to fetch previous lab report",
		});
		return;
	}
};

type DashboardTrendDirection = "up" | "down" | "stable";

interface DashboardTrendPoint {
	reportId: string;
	date: string;
	value: number;
	status: string;
	referenceMin: number | null;
	referenceMax: number | null;
}

interface DashboardTrendSeries {
	componentName: string;
	unit: string | null;
	points: DashboardTrendPoint[];
	latestValue: number | null;
	previousValue: number | null;
	delta: number | null;
	deltaPercent: number | null;
	trendDirection: DashboardTrendDirection;
	latestStatus: string;
}

interface MedicineAggregate {
	name: string;
	count: number;
	lastSeenAt: string;
}

interface DashboardLabReportRow {
	id: string;
	createdAt: Date;
	overallRisk: string;
	abnormalCount: number;
	totalCount: number;
	components: Array<{
		componentName: string;
		observedValue: number | null;
		unit: string | null;
		status: string;
		referenceMin: number | null;
		referenceMax: number | null;
	}>;
}

const ABNORMAL_STATUSES = new Set(["critical", "high", "borderline", "low"]);
const ALLOWED_REPORT_WINDOWS = new Set([3, 6, 12]);

function normalizeMedicineName(name: string): string {
	return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function parsePrescriptionMedicines(value: unknown): string[] {
	if (!value || typeof value !== "object") return [];

	const record = value as { medicines?: unknown };
	if (!Array.isArray(record.medicines)) return [];

	return record.medicines
		.filter((item): item is string => typeof item === "string")
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
}

function toDeltaPercent(previous: number | null, latest: number | null): number | null {
	if (previous === null || latest === null) return null;
	if (previous === 0) return null;
	return ((latest - previous) / Math.abs(previous)) * 100;
}

function roundToTwo(value: number): number {
	return Math.round(value * 100) / 100;
}

export const getDashboardInsightsController = async (req: Request, res: Response) => {
	try {
		const userId = requireAuthenticatedUserId(req, res);
		if (!userId) return;

		const reportWindowQuery = Array.isArray(req.query.reportWindow)
			? req.query.reportWindow[0]
			: req.query.reportWindow;
		const parsedWindow = Number(reportWindowQuery);
		const reportWindow = ALLOWED_REPORT_WINDOWS.has(parsedWindow) ? parsedWindow : 6;
		const prescriptionWindow = Math.min(reportWindow * 4, 40);

		const [
			healthProfile,
			labReports,
			labReportCount,
			prescriptionHistory,
			prescriptionCount,
			medicineHistory,
			drugInteractionHistory,
			symptomHistory,
		] = await Promise.all([
			prisma.patientHealthProfile.findUnique({
				where: { userId },
				select: { id: true, healthRiskScore: true },
			}),
			prisma.labReport.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
				take: reportWindow,
				select: {
					id: true,
					createdAt: true,
					overallRisk: true,
					abnormalCount: true,
					totalCount: true,
					components: {
						select: {
							componentName: true,
							observedValue: true,
							unit: true,
							status: true,
							referenceMin: true,
							referenceMax: true,
						},
					},
				},
			}),
			prisma.labReport.count({ where: { userId } }),
			prisma.prescriptionHistory.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
				take: prescriptionWindow,
				select: {
					id: true,
					analysisResult: true,
					createdAt: true,
				},
			}),
			prisma.prescriptionHistory.count({ where: { userId } }),
			prisma.medicineHistory.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
				take: 8,
				select: { id: true, medicineName: true, createdAt: true },
			}),
			prisma.drugInteractionHistory.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
				take: 8,
				select: { id: true, drugs: true, createdAt: true },
			}),
			prisma.symptomAnalysisHistory.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
				take: 8,
				select: { id: true, symptoms: true, urgencyLevel: true, createdAt: true },
			}),
		]);

		const typedLabReports = labReports as unknown as DashboardLabReportRow[];
		const reportsAsc = [...typedLabReports].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
		const latestReport = typedLabReports[0] ?? null;

		const timeline = reportsAsc.map((report) => {
			let criticalCount = 0;
			let highCount = 0;
			let lowCount = 0;
			let borderlineCount = 0;
			let normalCount = 0;

			report.components.forEach((component) => {
				switch (component.status) {
					case "critical":
						criticalCount += 1;
						break;
					case "high":
						highCount += 1;
						break;
					case "low":
						lowCount += 1;
						break;
					case "borderline":
						borderlineCount += 1;
						break;
					case "normal":
						normalCount += 1;
						break;
					default:
						break;
				}
			});

			return {
				reportId: report.id,
				date: report.createdAt.toISOString(),
				criticalCount,
				highCount,
				lowCount,
				borderlineCount,
				normalCount,
				totalCount: report.totalCount,
			};
		});

		const seriesMap = new Map<
			string,
			{ componentName: string; unit: string | null; points: DashboardTrendPoint[] }
		>();

		reportsAsc.forEach((report) => {
			report.components.forEach((component) => {
				if (component.observedValue === null) return;

				const key = component.componentName.trim().toLowerCase();
				const point: DashboardTrendPoint = {
					reportId: report.id,
					date: report.createdAt.toISOString(),
					value: component.observedValue,
					status: component.status,
					referenceMin: component.referenceMin,
					referenceMax: component.referenceMax,
				};

				if (!seriesMap.has(key)) {
					seriesMap.set(key, {
						componentName: component.componentName,
						unit: component.unit,
						points: [point],
					});
					return;
				}

				const entry = seriesMap.get(key);
				if (!entry) return;
				entry.points.push(point);
				if (!entry.unit && component.unit) {
					entry.unit = component.unit;
				}
			});
		});

		const allSeries: DashboardTrendSeries[] = Array.from(seriesMap.values())
			.map((entry) => {
				const latestPoint = entry.points[entry.points.length - 1] ?? null;
				const previousPoint = entry.points.length > 1 ? entry.points[entry.points.length - 2] : null;

				const latestValue = latestPoint?.value ?? null;
				const previousValue = previousPoint?.value ?? null;
				const rawDelta = latestValue !== null && previousValue !== null ? latestValue - previousValue : null;
				const delta = rawDelta === null ? null : roundToTwo(rawDelta);
				const deltaPercent = toDeltaPercent(previousValue, latestValue);
				const trendDirection: DashboardTrendDirection =
					delta === null || delta === 0 ? "stable" : delta > 0 ? "up" : "down";

				return {
					componentName: entry.componentName,
					unit: entry.unit,
					points: entry.points,
					latestValue,
					previousValue,
					delta,
					deltaPercent: deltaPercent === null ? null : roundToTwo(deltaPercent),
					trendDirection,
					latestStatus: latestPoint?.status ?? "unknown",
				};
			})
			.filter((series) => series.points.length > 0);

		const scoredSeries = allSeries
			.map((series) => {
				const absDeltaPercent = Math.abs(series.deltaPercent ?? 0);
				const absDelta = Math.abs(series.delta ?? 0);
				const latestAbnormalBoost = ABNORMAL_STATUSES.has(series.latestStatus) ? 70 : 0;
				const criticalBoost = series.latestStatus === "critical" ? 30 : 0;
				const score = absDeltaPercent + absDelta + latestAbnormalBoost + criticalBoost;
				return { series, score };
			})
			.sort((a, b) => b.score - a.score);

		const topSeries = scoredSeries.slice(0, 5).map((item) => item.series);

		const medicinesByName = new Map<string, { displayName: string; count: number; lastSeenAt: Date }>();

		prescriptionHistory.forEach((prescription) => {
			const medicines = parsePrescriptionMedicines(prescription.analysisResult);
			medicines.forEach((medicineName) => {
				const key = normalizeMedicineName(medicineName);
				const existing = medicinesByName.get(key);
				if (!existing) {
					medicinesByName.set(key, {
						displayName: medicineName,
						count: 1,
						lastSeenAt: prescription.createdAt,
					});
					return;
				}

				existing.count += 1;
				if (prescription.createdAt.getTime() > existing.lastSeenAt.getTime()) {
					existing.lastSeenAt = prescription.createdAt;
					existing.displayName = medicineName;
				}
			});
		});

		const medicineAggregates: MedicineAggregate[] = Array.from(medicinesByName.values()).map((item) => ({
			name: item.displayName,
			count: item.count,
			lastSeenAt: item.lastSeenAt.toISOString(),
		}));

		const recentMedicines = [...medicineAggregates]
			.sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime())
			.slice(0, 6);

		const frequentMedicines = [...medicineAggregates]
			.sort((a, b) => b.count - a.count || new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime())
			.slice(0, 6);

		const recentActivity = [
			...medicineHistory.map((item) => ({
				id: item.id,
				type: "medicine",
				title: item.medicineName || "Medicine Lookup",
				subtitle: "Medicine analysis",
				date: item.createdAt.toISOString(),
			})),
			...prescriptionHistory.map((item) => ({
				id: item.id,
				type: "prescription",
				title: "Prescription Scan",
				subtitle: `${parsePrescriptionMedicines(item.analysisResult).length} medicines extracted`,
				date: item.createdAt.toISOString(),
			})),
			...drugInteractionHistory.map((item) => ({
				id: item.id,
				type: "interaction",
				title: item.drugs.slice(0, 2).join(" + "),
				subtitle: `${item.drugs.length} drugs checked`,
				date: item.createdAt.toISOString(),
			})),
			...symptomHistory.map((item) => ({
				id: item.id,
				type: "symptom",
				title: item.symptoms.slice(0, 2).join(", "),
				subtitle: `Urgency: ${item.urgencyLevel}`,
				date: item.createdAt.toISOString(),
			})),
		]
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.slice(0, 8);

		const insightCards = topSeries.slice(0, 4).map((series) => {
			const latest = series.latestValue;
			const previous = series.previousValue;
			const directionWord =
				series.trendDirection === "up"
					? "increased"
					: series.trendDirection === "down"
						? "decreased"
						: "is stable";

			const metricLabel = series.componentName;
			const unitLabel = series.unit ? ` ${series.unit}` : "";
			const valueMessage =
				latest !== null && previous !== null
					? `${metricLabel} ${directionWord} from ${roundToTwo(previous)} to ${roundToTwo(latest)}${unitLabel}.`
					: `${metricLabel} latest value is ${latest ?? "unavailable"}${unitLabel}.`;

			const rangeMessage = ABNORMAL_STATUSES.has(series.latestStatus)
				? `${metricLabel} is currently ${series.latestStatus}.`
				: `${metricLabel} is currently within a safer range.`;

			const severity =
				series.latestStatus === "critical" || series.latestStatus === "high"
					? "high"
					: ABNORMAL_STATUSES.has(series.latestStatus)
						? "moderate"
						: "info";

			return {
				componentName: metricLabel,
				title: `${metricLabel} trend`,
				message: `${valueMessage} ${rangeMessage}`,
				severity,
				direction: series.trendDirection,
			};
		});

		const latestHighRiskComponents =
			latestReport?.components.filter(
				(component) => component.status === "high" || component.status === "critical"
			).length ?? 0;

		const latestAbnormalComponents =
			latestReport?.components.filter((component) => ABNORMAL_STATUSES.has(component.status)).length ?? 0;

		return res.status(200).json({
			generatedAt: new Date().toISOString(),
			meta: {
				reportWindow,
			},
			snapshot: {
				profileComplete: Boolean(healthProfile),
				healthScore: healthProfile?.healthRiskScore ?? null,
				lastLabReportAt: latestReport?.createdAt.toISOString() ?? null,
				totalLabReports: labReportCount,
				totalPrescriptionScans: prescriptionCount,
				highRiskComponents: latestHighRiskComponents,
				abnormalComponents: latestAbnormalComponents,
				latestOverallRisk: latestReport?.overallRisk ?? null,
			},
			prescribedMedicines: {
				recent: recentMedicines,
				frequent: frequentMedicines,
				lastPrescriptionAt: prescriptionHistory[0]?.createdAt.toISOString() ?? null,
			},
			labTrends: {
				series: topSeries,
				timeline,
				insights: insightCards,
			},
			recentActivity,
		});
	} catch (error) {
		handleControllerError({
			error,
			res,
			logger,
			context: "Failed to fetch dashboard insights",
			internalErrorMessage: "Failed to fetch dashboard insights",
		});
		return;
	}
};
