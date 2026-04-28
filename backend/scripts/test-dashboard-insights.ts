import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.API_URL || "http://127.0.0.1:4000/api";

async function run() {
	console.log("🚀 Starting dashboard insights verification...");

	const timestamp = Date.now();
	const email = `insights_test_${timestamp}@example.com`;
	const password = "password123";
	const name = "Insights Tester";

	try {
		await axios.post(`${API_URL}/auth/signup`, { email, password, name, gender: "Male" });
		const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
		const token = loginRes.data.tokens.accessToken as string;
		console.log("✅ User setup complete");

		const fetchInsights = async (reportWindow: 3 | 6 | 12) => {
			const res = await axios.get(`${API_URL}/reports/dashboard-insights`, {
				headers: { Authorization: `Bearer ${token}` },
				params: { reportWindow },
			});
			return res.data as {
				meta?: { reportWindow?: number };
				labTrends?: { timeline?: Array<unknown> };
				prescribedMedicines?: { recent?: Array<unknown>; frequent?: Array<unknown> };
			};
		};

		for (const reportWindow of [3, 6, 12] as const) {
			const data = await fetchInsights(reportWindow);

			if (data.meta?.reportWindow !== reportWindow) {
				throw new Error(`Expected meta.reportWindow=${reportWindow}, got ${String(data.meta?.reportWindow)}`);
			}

			const timelineLength = data.labTrends?.timeline?.length ?? 0;
			if (timelineLength > reportWindow) {
				throw new Error(`Timeline length ${timelineLength} exceeds requested window ${reportWindow}`);
			}

			console.log(
				`✅ reportWindow=${reportWindow} -> timeline=${timelineLength}, recentMeds=${data.prescribedMedicines?.recent?.length ?? 0}, frequentMeds=${data.prescribedMedicines?.frequent?.length ?? 0}`
			);
		}

		const invalidWindowRes = await axios.get(`${API_URL}/reports/dashboard-insights`, {
			headers: { Authorization: `Bearer ${token}` },
			params: { reportWindow: 999 },
		});
		const fallbackWindow = invalidWindowRes.data?.meta?.reportWindow;
		if (fallbackWindow !== 6) {
			throw new Error(`Expected invalid reportWindow fallback to 6, got ${String(fallbackWindow)}`);
		}
		console.log("✅ invalid reportWindow fallback verified (defaults to 6)");

		console.log("🎉 Dashboard insights verification completed");
	} catch (error: unknown) {
		if (axios.isAxiosError(error)) {
			console.error("❌ Test failed:", error.response?.data ?? error.message);
		} else {
			console.error("❌ Test failed:", error);
		}
		process.exit(1);
	}
}

void run();
