export function extractJsonObjectString(raw: string): string | null {
	const cleaned = raw
		.replace(/```json/g, "")
		.replace(/```/g, "")
		.trim();
	const match = cleaned.match(/\{[\s\S]*\}/);
	return match ? match[0] : null;
}

export function parseJsonObject(raw: string, errorMessage = "Invalid AI response format"): Record<string, unknown> {
	const jsonString = extractJsonObjectString(raw);
	if (!jsonString) {
		throw new Error(errorMessage);
	}

	try {
		const parsed = JSON.parse(jsonString) as unknown;
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			throw new Error(errorMessage);
		}
		return parsed as Record<string, unknown>;
	} catch {
		throw new Error(errorMessage);
	}
}
