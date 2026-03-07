import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import prisma from "../db/prisma";
import logger from "../config/logger";
import { generateContent } from "../services/ai/gemini"; // Reusing existing AI service

interface AuthenticatedRequest extends Request {
	user?: {
		userId: string;
	};
}

/**
 * Render markdown-formatted text into a PDFKit document with proper formatting.
 * Handles: **bold**, *italic*, # headings, bullet lists, and inline code.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderMarkdownText(doc: any, text: string, opts: { width?: number; lineGap?: number } = {}) {
	const LEFT = 50;
	const width = opts.width ?? 495;
	const lineGap = opts.lineGap ?? 3;

	const lines = text.split("\n");
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) {
			doc.moveDown(0.3);
			continue;
		}

		// Heading lines (## Heading Text)
		const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
		if (headingMatch) {
			const level = headingMatch[1].length;
			const headingText = headingMatch[2].replace(/\*\*/g, "");
			doc.font("Helvetica-Bold")
				.fontSize(level === 1 ? 13 : level === 2 ? 11 : 10)
				.text(headingText, LEFT, doc.y, { width, lineGap });
			doc.moveDown(0.3);
			doc.font("Helvetica").fontSize(10);
			continue;
		}

		// Bullet lines (- item, * item, + item, or 1. item)
		const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);
		const numberedMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
		const content = bulletMatch?.[1] || numberedMatch?.[1];

		if (content) {
			doc.circle(LEFT + 10, doc.y + 4, 2).fill("black");
			renderInlineMarkdown(doc, content, LEFT + 20, width - 25, lineGap);
			doc.moveDown(0.2);
			continue;
		}

		// Regular paragraph with inline formatting
		renderInlineMarkdown(doc, trimmed, LEFT, width, lineGap);
	}
	doc.font("Helvetica").fontSize(10);
}

/**
 * Render a single line of text, handling inline **bold** and *italic* segments.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderInlineMarkdown(doc: any, text: string, x: number, width: number, lineGap: number) {
	// Split by **bold** and *italic* markers
	const parts: { text: string; bold: boolean; italic: boolean }[] = [];
	const regex = /\*\*(.+?)\*\*|\*(.+?)\*|([^*]+)/g;
	let match;
	while ((match = regex.exec(text)) !== null) {
		if (match[1] !== undefined) {
			parts.push({ text: match[1], bold: true, italic: false });
		} else if (match[2] !== undefined) {
			parts.push({ text: match[2], bold: false, italic: true });
		} else if (match[3] !== undefined) {
			parts.push({ text: match[3].replace(/`/g, ""), bold: false, italic: false });
		}
	}

	if (parts.length === 0) return;

	// Single segment — simple render
	if (parts.length === 1) {
		const p = parts[0];
		doc.font(p.bold ? "Helvetica-Bold" : p.italic ? "Helvetica-Oblique" : "Helvetica")
			.fontSize(10)
			.text(p.text, x, doc.y, { width, lineGap });
		doc.font("Helvetica").fontSize(10);
		return;
	}

	// Multiple segments — use continued:true for inline font switching
	for (let i = 0; i < parts.length; i++) {
		const p = parts[i];
		const isLast = i === parts.length - 1;
		doc.font(p.bold ? "Helvetica-Bold" : p.italic ? "Helvetica-Oblique" : "Helvetica").fontSize(10);

		if (i === 0) {
			doc.text(p.text, x, doc.y, { width, lineGap, continued: !isLast });
		} else {
			doc.text(p.text, { width, lineGap, continued: !isLast });
		}
	}
	doc.font("Helvetica").fontSize(10);
}

export const generateHealthReport = async (req: Request, res: Response) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });

		// Parse selected data sources (default: all enabled)
		const validSources = ["symptoms", "prescriptions", "medicines", "drugInteractions", "chatHistory"] as const;
		const rawSources: string[] = Array.isArray(req.body?.sources) ? req.body.sources : [...validSources];
		const sources = new Set(rawSources.filter((s) => (validSources as readonly string[]).includes(s)));

		const DATA_LIMIT = 20;

		// 1. Fetch User Data — conditionally include relations
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				patientHealthProfile: true,
				...(sources.has("symptoms") && {
					symptomAnalysisHistories: { orderBy: { createdAt: "desc" as const }, take: DATA_LIMIT },
				}),
				...(sources.has("medicines") && {
					medicineHistory: { orderBy: { createdAt: "desc" as const }, take: DATA_LIMIT },
				}),
				...(sources.has("prescriptions") && {
					prescriptionHistory: { orderBy: { createdAt: "desc" as const }, take: DATA_LIMIT },
				}),
				...(sources.has("drugInteractions") && {
					drugInteractionHistory: { orderBy: { createdAt: "desc" as const }, take: DATA_LIMIT },
				}),
				...(sources.has("chatHistory") && {
					chats: {
						orderBy: { updatedAt: "desc" as const },
						take: 10,
						include: {
							messages: {
								orderBy: { createdAt: "desc" as const },
								take: 3,
								select: { role: true, content: true },
							},
						},
					},
				}),
			},
		});

		if (!user) return res.status(404).json({ error: "User not found" });

		// 2. Build data sections for the AI prompt
		const profile = user.patientHealthProfile;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const userData = user as any;

		let dataContext = "";

		if (sources.has("symptoms") && userData.symptomAnalysisHistories?.length) {
			const symptomLines = userData.symptomAnalysisHistories
				.map(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(h: any) =>
						`- [${new Date(h.createdAt).toLocaleDateString()}] ${h.symptoms.join(", ")} (Urgency: ${h.urgencyLevel}, Severity: ${h.severity || "N/A"})`
				)
				.join("\n");
			dataContext += `\n\nRecent Symptom Analysis (${userData.symptomAnalysisHistories.length} records):\n${symptomLines}`;
		}

		if (sources.has("prescriptions") && userData.prescriptionHistory?.length) {
			const rxLines = userData.prescriptionHistory
				.map(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(h: any) =>
						`- [${new Date(h.createdAt).toLocaleDateString()}] ${h.extractedText?.slice(0, 400) || "No text extracted"}`
				)
				.join("\n");
			dataContext += `\n\nRecent Prescriptions (${userData.prescriptionHistory.length} records):\n${rxLines}`;
		}

		if (sources.has("medicines") && userData.medicineHistory?.length) {
			const medLines = userData.medicineHistory
				.map(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(h: any) => `- [${new Date(h.createdAt).toLocaleDateString()}] ${h.medicineName}`
				)
				.join("\n");
			dataContext += `\n\nRecent Medicine Searches (${userData.medicineHistory.length} records):\n${medLines}`;
		}

		if (sources.has("drugInteractions") && userData.drugInteractionHistory?.length) {
			const diLines = userData.drugInteractionHistory
				.map(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(h: any) => {
						const drugs = Array.isArray(h.drugs) ? h.drugs.join(" + ") : String(h.drugs);
						return `- [${new Date(h.createdAt).toLocaleDateString()}] ${drugs}`;
					}
				)
				.join("\n");
			dataContext += `\n\nRecent Drug Interaction Checks (${userData.drugInteractionHistory.length} records):\n${diLines}`;
		}

		if (sources.has("chatHistory") && userData.chats?.length) {
			const chatLines = userData.chats
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.map((c: any) => {
					const preview = c.messages?.[0]?.content?.slice(0, 100) || "";
					return `- "${c.title}" — ${preview}`;
				})
				.join("\n");
			dataContext += `\n\nRecent Chat Conversations (${userData.chats.length} chats):\n${chatLines}`;
		}

		const selectedSourcesList = ["Health Profile", ...Array.from(sources)].join(", ");

		const prompt = `
            Act as an expert medical consultant. Create a UNIFIED HEALTH REPORT for this patient.
            This report should be comprehensive enough that any doctor can understand the patient's 
            complete health picture without needing any other documents.
            
            Data sources included: ${selectedSourcesList}
            
            Patient Profile:
            - Age/Gender: ${user.gender || "Not specified"}
            - Blood Group: ${profile?.bloodGroup || "Unknown"}
            - Chronic Conditions: ${profile?.chronicConditions.join(", ") || "None"}
            - Allergies: ${profile?.allergies.join(", ") || "None"}
            ${dataContext}

            Provide the output in the following JSON format:
            {
                "detailedAnalysis": "A thorough analysis of the patient's current health status, connecting dots between prescriptions, symptoms, medicines, and any patterns you observe.",
                "executiveSummary": "A concise 3-4 sentence summary a doctor can read in 30 seconds to understand the key findings.",
                "healthTrends": "Identify health trends and timeline patterns. Note recurring issues, medication patterns, worsening or improving conditions, and any correlations (e.g., repeated prescriptions for same condition, escalating symptoms). If no clear trends, note that.",
                "chatSummary": "Brief summary of health topics the patient has been discussing with the AI assistant. If no chat data, say 'No chat history available.'",
                "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2", "Actionable recommendation 3"]
            }
        `;

		let aiInsight = {
			detailedAnalysis: "Analysis unavailable.",
			executiveSummary: "Summary unavailable.",
			healthTrends: "No trends data available.",
			chatSummary: "No chat history available.",
			recommendations: [] as string[],
		};

		try {
			const aiResponse = await generateContent(prompt);
			const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				aiInsight = JSON.parse(jsonMatch[0]);
			} else {
				aiInsight.detailedAnalysis = aiResponse;
			}
		} catch (aiError: unknown) {
			const errorMessage = aiError instanceof Error ? aiError.message : "Unknown AI error";
			logger.error({ err: aiError }, "Failed to generate AI health summary");
			return res.status(503).json({
				error: "AI Health Analysis Failed",
				details: errorMessage || "Unable to generate report content at this time.",
			});
		}

		// 3. Generate PDF
		const doc = new PDFDocument({
			margins: { top: 50, bottom: 80, left: 50, right: 50 },
			size: "A4",
			bufferPages: true,
		});

		const buffers: Buffer[] = [];
		doc.on("data", (chunk: Buffer) => buffers.push(chunk));
		doc.on("end", async () => {
			const pdfBuffer = Buffer.concat(buffers);

			try {
				// Import dynamically to avoid circular dependency if any, or just import at top if clean.
				// Using valid import from service.
				const { uploadFile, deleteImage } = await import("../services/cloudinary/cloudinary");

				const timestamp = Date.now();
				const filename = `health_report_${userId}_${timestamp}`;

				// Use 'image' resource type for PDFs to allow public delivery and viewing
				// Cloudinary treats PDFs as images for transformation and delivery purposes.
				const { url: reportUrl, publicId } = await uploadFile(pdfBuffer, "niraksh_reports", "image", filename);

				// --- Implement Storage Limit (Max 10 per User) ---
				const MAX_REPORTS = 10;
				const reportCount = await prisma.healthReport.count({
					where: { userId: userId },
				});

				if (reportCount >= MAX_REPORTS) {
					// Fetch limits to keep latest 9, so we can add 1 to make 10?
					// No, prompt says "Stores only 10 recent... and overwrite old one".
					// So if we have 10, delete 1 (oldest), then add 1. Total 10.
					const oldestReports = await prisma.healthReport.findMany({
						where: { userId: userId },
						orderBy: { createdAt: "asc" },
						take: reportCount - MAX_REPORTS + 1,
					});

					for (const oldReport of oldestReports) {
						// Delete from Cloudinary
						if (oldReport.publicId) {
							try {
								await deleteImage(oldReport.publicId);
								logger.info({ publicId: oldReport.publicId }, "Deleted old report from Cloudinary");
							} catch (delErr) {
								logger.error({ err: delErr }, "Failed to delete old report from Cloudinary");
							}
						}
						// Delete from DB
						await prisma.healthReport.delete({
							where: { id: oldReport.id },
						});
					}
				}

				// Save new report to DB
				await prisma.healthReport.create({
					data: {
						userId: userId,
						reportUrl: reportUrl,
						publicId: publicId,
						sources: Array.from(sources),
						detailedAnalysis: aiInsight.detailedAnalysis,
						executiveSummary: aiInsight.executiveSummary,
						healthTrends: aiInsight.healthTrends,
						chatSummary: aiInsight.chatSummary,
						recommendations: aiInsight.recommendations || [],
					},
				});

				res.status(200).json({
					message: "Health report generated successfully",
					reportUrl: reportUrl,
				});
			} catch (uploadError: unknown) {
				logger.error({ err: uploadError }, "Failed to upload health report");
				res.status(500).json({ error: "Failed to upload report to cloud storage" });
			}
		});

		// Header
		doc.fillColor("#333333")
			.fontSize(24)
			.font("Helvetica-Bold")
			.text("Niraksh Guardian", { align: "center" })
			.fontSize(10)
			.font("Helvetica")
			.text("Unified Health Report", { align: "center" });

		doc.moveDown();
		doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").lineWidth(1).stroke();
		doc.moveDown(1.5);

		// --- Patient Details & Metadata (2-Column Grid) ---
		const col1 = 50;
		const col2 = 300;
		let y = doc.y;

		// Column 1: Patient Details
		doc.font("Helvetica-Bold").fontSize(12).text("Patient Details", col1, y);
		y += 20;
		doc.font("Helvetica").fontSize(10);
		doc.text(`Name: ${user.name || "N/A"}`, col1, y);
		doc.text(`Email: ${user.email}`, col1, y + 15);
		doc.text(`Gender: ${user.gender || "N/A"}`, col1, y + 30);

		// Column 2: Report Metadata
		const metaY = doc.y - 50; // Reset Y to top of section
		doc.font("Helvetica-Bold").fontSize(12).text("Report Info", col2, metaY);
		y = metaY + 20;
		doc.font("Helvetica").fontSize(10);
		doc.text(`Date: ${new Date().toLocaleDateString()}`, col2, y);
		doc.text(`Report ID: #${Math.floor(Math.random() * 100000)}`, col2, y + 15);
		doc.moveDown(4);

		// --- Medical Profile (Boxed Section) ---
		const boxY = doc.y;
		doc.roundedRect(50, boxY, 495, 70, 5).fill("#f9f9f9").stroke("#e0e0e0");
		doc.fillColor("#000000");

		doc.font("Helvetica-Bold")
			.fontSize(12)
			.text("Medical Profile", 65, boxY + 10);

		doc.font("Helvetica").fontSize(10);
		// Row 1
		doc.text("Blood Group:", 65, boxY + 30);
		doc.font("Helvetica-Bold").text(profile?.bloodGroup || "N/A", 140, boxY + 30);

		doc.font("Helvetica").text("Risk Score:", 300, boxY + 30);
		const score = profile?.healthRiskScore ?? 0;
		if (score > 70) doc.fillColor("red");
		else if (score > 40) doc.fillColor("orange");
		else doc.fillColor("green");
		doc.font("Helvetica-Bold").text(`${score}/100`, 370, boxY + 30);
		doc.fillColor("black"); // Reset color

		// Row 2
		doc.font("Helvetica").text("Chronic Conditions:", 65, boxY + 45);
		doc.font("Helvetica-Bold").text(profile?.chronicConditions.join(", ") || "None", 170, boxY + 45, {
			width: 300,
			lineGap: 2,
		});

		// Allergies
		doc.text("Allergies:", 300, boxY + 45); // Side by side with conditions
		doc.font("Helvetica-Bold").text(profile?.allergies.join(", ") || "None", 360, boxY + 45, {
			width: 140,
			lineGap: 2,
		});

		doc.moveDown(4);

		// --- AI Health Intelligence ---
		doc.font("Helvetica-Bold").fontSize(14).text("AI Health Intelligence", 50, doc.y);
		doc.moveTo(50, doc.y + 5)
			.lineTo(545, doc.y + 5)
			.lineWidth(0.5)
			.stroke();
		doc.moveDown(1);

		// detailed Analysis
		doc.font("Helvetica-Bold").fontSize(12).text("Detailed Analysis");
		doc.moveDown(0.3);
		renderMarkdownText(doc, aiInsight.detailedAnalysis, { width: 495, lineGap: 3 });
		doc.moveDown(1.5);

		// Executive Summary
		doc.font("Helvetica-Bold").fontSize(12).text("Executive Summary");
		doc.moveDown(0.3);
		doc.fillColor("#444444");
		renderMarkdownText(doc, aiInsight.executiveSummary, { width: 495, lineGap: 3 });
		doc.fillColor("black");
		doc.moveDown(1.5);

		// Recommendations
		if (aiInsight.recommendations && aiInsight.recommendations.length > 0) {
			doc.font("Helvetica-Bold").fontSize(12).text("Clinical Recommendations");
			doc.moveDown(0.5);
			aiInsight.recommendations.forEach((rec) => {
				doc.circle(60, doc.y + 4, 2).fill("black");
				renderInlineMarkdown(doc, rec, 75, 450, 3);
				doc.moveDown(0.5);
			});
		}
		doc.moveDown(1.5);

		// Health Trends & Timeline
		if (aiInsight.healthTrends && aiInsight.healthTrends !== "No trends data available.") {
			doc.font("Helvetica-Bold").fontSize(12).text("Health Trends & Timeline", 50, doc.y);
			doc.moveDown(0.3);
			renderMarkdownText(doc, aiInsight.healthTrends, { width: 495, lineGap: 3 });
			doc.moveDown(1.5);
		}

		// Chat History Summary
		if (
			sources.has("chatHistory") &&
			aiInsight.chatSummary &&
			aiInsight.chatSummary !== "No chat history available."
		) {
			doc.font("Helvetica-Bold").fontSize(12).text("AI Chat History Summary", 50, doc.y);
			doc.moveDown(0.3);
			renderMarkdownText(doc, aiInsight.chatSummary, { width: 495, lineGap: 3 });
			doc.moveDown(1.5);
		}

		doc.moveDown(1);

		// === HELPER: Draw a section heading with underline ===
		const drawSectionHeading = (title: string) => {
			if (doc.y > 700) doc.addPage();
			doc.font("Helvetica-Bold").fontSize(14).text(title, 50, doc.y);
			doc.moveTo(50, doc.y + 5)
				.lineTo(545, doc.y + 5)
				.strokeColor("#cccccc")
				.lineWidth(0.5)
				.stroke();
			doc.moveDown(1);
		};

		// === HELPER: Draw a simple table row ===
		const drawTableRow = (rowYPos: number, cols: { text: string; x: number; width?: number; color?: string }[]) => {
			let maxH = 15;
			for (const col of cols) {
				if (col.color) doc.fillColor(col.color);
				else doc.fillColor("black");
				doc.font("Helvetica")
					.fontSize(9)
					.text(col.text, col.x, rowYPos, { width: col.width || 150, lineGap: 2 });
				const h = doc.heightOfString(col.text, { width: col.width || 150 });
				if (h > maxH) maxH = h;
			}
			doc.fillColor("black");
			const rh = Math.max(18, maxH + 8);
			doc.moveTo(50, rowYPos + rh)
				.lineTo(545, rowYPos + rh)
				.strokeColor("#eeeeee")
				.lineWidth(0.5)
				.stroke();
			return rh;
		};

		// ─── 1. RECENT PRESCRIPTION HISTORY (PRIMARY) ───────────────
		if (sources.has("prescriptions")) {
			drawSectionHeading("Recent Prescription History");

			if (!userData.prescriptionHistory?.length) {
				doc.font("Helvetica")
					.fontSize(10)
					.text("No recent prescriptions recorded.", 50, doc.y, { align: "center", width: 495 });
			} else {
				// Table header
				const thY = doc.y;
				doc.rect(50, thY, 495, 20).fill("#eeeeee").stroke();
				doc.fillColor("black").font("Helvetica-Bold").fontSize(9);
				doc.text("Date", 55, thY + 5);
				doc.text("Prescription Summary", 150, thY + 5);

				let rY = thY + 25;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				userData.prescriptionHistory.forEach((rx: any) => {
					if (rY > 740) {
						doc.addPage();
						rY = 50;
					}
					const summary = rx.extractedText?.slice(0, 300) || "No text extracted";
					const rh = drawTableRow(rY, [
						{ text: new Date(rx.createdAt).toLocaleDateString(), x: 55, width: 80 },
						{ text: summary, x: 150, width: 390 },
					]);
					rY += rh;
				});
				doc.y = rY; // sync PDFKit cursor with manual row position
			}
			doc.moveDown(2);
		}

		// ─── 2. RECENT SYMPTOM HISTORY ──────────────────────────────
		if (sources.has("symptoms")) {
			drawSectionHeading("Recent Symptom Analysis");

			if (!userData.symptomAnalysisHistories?.length) {
				doc.font("Helvetica")
					.fontSize(10)
					.text("No recent symptoms recorded.", 50, doc.y, { align: "center", width: 495 });
			} else {
				const thY = doc.y;
				doc.rect(50, thY, 495, 20).fill("#eeeeee").stroke();
				doc.fillColor("black").font("Helvetica-Bold").fontSize(9);
				doc.text("Date", 55, thY + 5);
				doc.text("Reported Symptoms", 150, thY + 5);
				doc.text("Severity", 400, thY + 5);
				doc.text("Urgency", 470, thY + 5);

				let rY = thY + 25;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				userData.symptomAnalysisHistories.forEach((record: any) => {
					if (rY > 740) {
						doc.addPage();
						rY = 50;
					}
					const urgColor =
						record.urgencyLevel === "Emergency Room"
							? "red"
							: record.urgencyLevel === "Doctor Visit"
								? "orange"
								: "green";
					const rh = drawTableRow(rY, [
						{ text: record.createdAt.toLocaleDateString(), x: 55, width: 80 },
						{ text: record.symptoms.join(", "), x: 150, width: 240 },
						{ text: record.severity || "N/A", x: 400, width: 60 },
						{ text: record.urgencyLevel, x: 470, width: 70, color: urgColor },
					]);
					rY += rh;
				});
				doc.y = rY; // sync PDFKit cursor with manual row position
			}
			doc.moveDown(2);
		}

		// ─── 3. RECENT MEDICINE SEARCHES ───────────────────────────
		if (sources.has("medicines") && userData.medicineHistory?.length) {
			drawSectionHeading("Recent Medicine Searches");
			doc.font("Helvetica").fontSize(10);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			userData.medicineHistory.forEach((med: any) => {
				doc.circle(60, doc.y + 3, 2).fill("black");
				doc.text(`${med.medicineName} — ${new Date(med.createdAt).toLocaleDateString()}`, 75, doc.y - 2, {
					width: 450,
				});
				doc.moveDown(0.3);
			});
			doc.moveDown(2);
		}

		// ─── 4. RECENT DRUG INTERACTION CHECKS ─────────────────────
		if (sources.has("drugInteractions") && userData.drugInteractionHistory?.length) {
			drawSectionHeading("Recent Drug Interaction Checks");
			doc.font("Helvetica").fontSize(10);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			userData.drugInteractionHistory.forEach((di: any) => {
				const drugs = Array.isArray(di.drugs) ? di.drugs.join(" + ") : String(di.drugs);
				doc.circle(60, doc.y + 3, 2).fill("black");
				doc.text(`${drugs} — ${new Date(di.createdAt).toLocaleDateString()}`, 75, doc.y - 2, { width: 450 });
				doc.moveDown(0.3);
			});
			doc.moveDown(2);
		}

		// Footer
		const range = doc.bufferedPageRange();
		for (let i = range.start; i < range.start + range.count; i++) {
			doc.switchToPage(i);

			// Allow writing in bottom margin without triggering new page
			const oldBottomMargin = doc.page.margins.bottom;
			doc.page.margins.bottom = 0;

			const bottom = doc.page.height - 30;
			doc.fontSize(8)
				.fillColor("#888888")
				.text("Generated by Niraksh Guardian AI • Consult a doctor for professional advice.", 50, bottom, {
					align: "center",
					width: 495,
				});

			// Restore margin
			doc.page.margins.bottom = oldBottomMargin;
		}

		doc.end();
	} catch (error) {
		logger.error({ err: error }, "Error generating health report");
		// Check if headers already sent to avoid crashing
		if (!res.headersSent) {
			res.status(500).json({ error: "Failed to generate health report" });
		}
	}
};

export const listHealthReports = async (req: Request, res: Response) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });

		const reports = await prisma.healthReport.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				reportUrl: true,
				createdAt: true,
			},
		});

		res.json(reports);
	} catch (error) {
		logger.error({ err: error }, "Error listing health reports");
		res.status(500).json({ error: "Failed to list health reports" });
	}
};
