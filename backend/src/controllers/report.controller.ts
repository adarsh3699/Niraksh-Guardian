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

export const generateHealthReport = async (req: Request, res: Response) => {
	try {
		const userId = (req as AuthenticatedRequest).user?.userId;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });

		// 1. Fetch User Data
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				patientHealthProfile: true,
				symptomAnalysisHistories: {
					// Corrected plural name
					orderBy: { createdAt: "desc" },
					take: 5,
				},
				medicineHistory: {
					orderBy: { createdAt: "desc" },
					take: 5,
				},
			},
		});

		if (!user) return res.status(404).json({ error: "User not found" });

		// 2. Generate AI Summary using Gemini
		const profile = user.patientHealthProfile;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const recentSymptoms = user.symptomAnalysisHistories.map((h: any) => h.symptoms.join(", ")).join("; ");

		const prompt = `
            Act as an expert medical consultant. Analyze the following patient health data and provide a comprehensive health report.
            
            Patient Profile:
            - Age/Gender: ${user.gender || "Not specified"}
            - Blood Group: ${profile?.bloodGroup || "Unknown"}
            - Chronic Conditions: ${profile?.chronicConditions.join(", ") || "None"}
            - Allergies: ${profile?.allergies.join(", ") || "None"}
            - Recent Symptoms history: ${recentSymptoms || "No recent symptoms recorded."}

            Provide the output in the following JSON format:
            {
                "detailedAnalysis": "A deep dive into the patient's current health status, potential risks based on chronic conditions and recent symptoms, and possible correlations.",
                "executiveSummary": "A concise 3-4 sentence summary of the key findings.",
                "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2", "Actionable recommendation 3"]
            }
        `;

		let aiInsight = {
			detailedAnalysis: "Analysis unavailable.",
			executiveSummary: "Summary unavailable.",
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
		} catch (aiError) {
			logger.error({ err: aiError }, "Failed to generate AI health summary");
		}

		// 3. Generate PDF
		const doc = new PDFDocument({
			margins: { top: 50, bottom: 80, left: 50, right: 50 },
			size: "A4",
			bufferPages: true,
		});

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", `attachment; filename=health_report_${userId}.pdf`);

		doc.pipe(res);

		// --- Header ---
		doc.fillColor("#333333")
			.fontSize(24)
			.font("Helvetica-Bold")
			.text("Niraksh Guardian", { align: "center" })
			.fontSize(10)
			.font("Helvetica")
			.text("Advanced AI Health Monitoring System", { align: "center" });

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
		// Adjust height if wrapped? For simplicity, single line assume or small wrap.
		// Actually, let's just place Allergies below or skip if overlapping.
		// Better:
		// Row 3 (Allergies)
		// Fixed coord might overlap if conditions wrap.
		// Let's use relative positioning for Allergies if possible, or just strict one-line assumption for now to keep it aligned as user requested.
		// Actually, alignment usually implies "don't wrap messily".
		// Let's put allergies on same line if space, or next line.
		// Let's force next line for allergies to be safe.
		// y position for allergies:
		// doc.text("Allergies:", 65, boxY + 60);
		// doc.text(profile?.allergies.join(", ") || "None", 130, boxY + 60);

		// Let's just do Chronic and Allergies.
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
		doc.font("Helvetica").fontSize(10).text(aiInsight.detailedAnalysis, {
			align: "justify",
			width: 495,
			lineGap: 3,
		});
		doc.moveDown(1.5);

		// Executive Summary
		doc.font("Helvetica-Bold").fontSize(12).text("Executive Summary");
		doc.font("Helvetica-Oblique").fontSize(10).fillColor("#444444").text(aiInsight.executiveSummary, {
			align: "justify",
			width: 495,
			lineGap: 3,
		});
		doc.fillColor("black");
		doc.moveDown(1.5);

		// Recommendations
		if (aiInsight.recommendations && aiInsight.recommendations.length > 0) {
			doc.font("Helvetica-Bold").fontSize(12).text("Clinical Recommendations");
			doc.moveDown(0.5);
			doc.font("Helvetica").fontSize(10);
			aiInsight.recommendations.forEach((rec) => {
				// Bullet point
				doc.circle(60, doc.y + 3, 2).fill("black"); // Manual bullet
				doc.text(rec, 75, doc.y - 2, { width: 450, align: "left", lineGap: 3 });
				doc.moveDown(0.5);
			});
		}
		doc.moveDown(2);

		// --- Recent Symptom History (Table Layout) ---
		doc.font("Helvetica-Bold").fontSize(14).text("Recent Symptom History", 50, doc.y);
		doc.moveTo(50, doc.y + 5)
			.lineTo(545, doc.y + 5)
			.stroke();
		doc.moveDown(1);

		// Table Header
		const tableTop = doc.y;
		const colDate = 50;
		const colSym = 150;
		const colUrg = 450;

		doc.rect(50, tableTop, 495, 20).fill("#eeeeee").stroke();
		doc.fillColor("black").font("Helvetica-Bold").fontSize(10);
		doc.text("Date", colDate + 5, tableTop + 5);
		doc.text("Reported Symptoms", colSym, tableTop + 5);
		doc.text("Urgency", colUrg, tableTop + 5);

		doc.font("Helvetica").fontSize(10);
		let rowY = tableTop + 25;

		if (user.symptomAnalysisHistories.length === 0) {
			doc.text("No recent symptoms recorded.", 50, rowY, { align: "center", width: 495 });
		} else {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			user.symptomAnalysisHistories.forEach((record: any) => {
				// Check page break
				if (rowY > 750) {
					doc.addPage();
					rowY = 50;
					// Re-draw header? Or just continue. Continue is simpler for now.
				}

				doc.text(record.createdAt.toLocaleDateString(), colDate + 5, rowY);
				doc.text(record.symptoms.join(", "), colSym, rowY, { width: 280, lineGap: 2 });

				// Calculate height of symptoms text to know where next row starts
				const symHeight = doc.heightOfString(record.symptoms.join(", "), { width: 280 });

				// Color code urgency
				if (record.urgencyLevel === "High" || record.urgencyLevel === "Emergency") doc.fillColor("red");
				else if (record.urgencyLevel === "Moderate") doc.fillColor("orange");
				else doc.fillColor("green");

				doc.text(record.urgencyLevel, colUrg, rowY);
				doc.fillColor("black");

				// Draw row line
				const rowHeight = Math.max(20, symHeight + 10);
				doc.moveTo(50, rowY + rowHeight - 5)
					.lineTo(545, rowY + rowHeight - 5)
					.strokeColor("#eeeeee")
					.stroke(); // Light separator

				rowY += rowHeight;
			});
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
