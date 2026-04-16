/**
 * Category Classifier Utility
 *
 * Provides fallback classification for lab components when AI doesn't provide
 * a category or provides an invalid one. Maps component names to medical categories
 * using keyword matching.
 */

export type LabCategory =
	| "Lipid Panel"
	| "Hematology"
	| "Thyroid"
	| "Metabolic"
	| "Liver"
	| "Kidney"
	| "Electrolytes"
	| "Vitamins"
	| "Hormones"
	| "Microbiology"
	| "Other";

/**
 * Category keyword mappings for classification
 */
const CATEGORY_KEYWORDS: Record<LabCategory, string[]> = {
	"Lipid Panel": ["cholesterol", "ldl", "hdl", "triglyceride", "vldl", "lipid", "apolipoprotein", "apo"],
	Hematology: [
		"hemoglobin",
		"hgb",
		"hb",
		"wbc",
		"rbc",
		"platelet",
		"hematocrit",
		"hct",
		"mcv",
		"mch",
		"mchc",
		"rdw",
		"mpv",
		"neutrophil",
		"lymphocyte",
		"monocyte",
		"eosinophil",
		"basophil",
		"blood count",
		"cbc",
		"complete blood",
	],
	Thyroid: ["tsh", "thyroid", "t3", "t4", "free t3", "free t4", "ft3", "ft4", "thyroxine", "triiodothyronine"],
	Metabolic: [
		"glucose",
		"hba1c",
		"hemoglobin a1c",
		"a1c",
		"glycated",
		"glycosylated",
		"uric acid",
		"urate",
		"lactate",
		"pyruvate",
	],
	Liver: [
		"alt",
		"ast",
		"bilirubin",
		"alkaline phosphatase",
		"alp",
		"ggt",
		"gamma gt",
		"sgot",
		"sgpt",
		"total protein",
		"albumin",
		"globulin",
		"liver",
		"hepatic",
	],
	Kidney: ["creatinine", "urea", "egfr", "gfr", "bun", "blood urea nitrogen", "microalbumin", "renal", "kidney"],
	Electrolytes: [
		"sodium",
		"potassium",
		"chloride",
		"calcium",
		"magnesium",
		"phosphate",
		"phosphorus",
		"bicarbonate",
		"co2",
		"electrolyte",
	],
	Vitamins: [
		"vitamin d",
		"vitamin b12",
		"vitamin b",
		"folate",
		"folic acid",
		"vitamin a",
		"vitamin e",
		"vitamin c",
		"vitamin k",
		"25-oh",
		"hydroxyvitamin",
		"cobalamin",
	],
	Hormones: [
		"testosterone",
		"estrogen",
		"estradiol",
		"cortisol",
		"insulin",
		"prolactin",
		"fsh",
		"lh",
		"progesterone",
		"dhea",
		"growth hormone",
		"gh",
		"acth",
		"hormone",
	],
	Microbiology: [
		"culture",
		"sensitivity",
		"bacterial",
		"fungal",
		"viral",
		"organism",
		"colony",
		"cfu",
		"antibiotic",
		"susceptibility",
		"gram stain",
		"microbiology",
	],
	Other: [],
};

/**
 * Valid category names for validation
 */
const VALID_CATEGORIES: Set<string> = new Set([
	"Lipid Panel",
	"Hematology",
	"Thyroid",
	"Metabolic",
	"Liver",
	"Kidney",
	"Electrolytes",
	"Vitamins",
	"Hormones",
	"Microbiology",
	"Other",
]);

/**
 * Classifies a lab component into a medical category based on its name.
 * Uses keyword matching to determine the most appropriate category.
 * Checks more specific keywords first to avoid false matches.
 *
 * @param componentName - The name of the lab component
 * @returns The classified category, defaults to "Other" if no match found
 *
 * @example
 * classifyComponentCategory("Total Cholesterol") // returns "Lipid Panel"
 * classifyComponentCategory("Hemoglobin") // returns "Hematology"
 * classifyComponentCategory("Unknown Test") // returns "Other"
 */
export function classifyComponentCategory(componentName: string): LabCategory {
	if (!componentName || typeof componentName !== "string") {
		return "Other";
	}

	const normalizedName = componentName.toLowerCase().trim();

	// Priority order: Check Metabolic first for HbA1c-like tests to avoid Hematology false match
	const priorityCategories: LabCategory[] = ["Metabolic"];

	for (const category of priorityCategories) {
		const keywords = CATEGORY_KEYWORDS[category];
		for (const keyword of keywords) {
			if (normalizedName.includes(keyword.toLowerCase())) {
				return category;
			}
		}
	}

	// Check remaining categories
	for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
		if (category === "Other" || priorityCategories.includes(category as LabCategory)) {
			continue;
		}

		for (const keyword of keywords) {
			if (normalizedName.includes(keyword.toLowerCase())) {
				return category as LabCategory;
			}
		}
	}

	// Default to "Other" if no match found
	return "Other";
}

/**
 * Validates if a category string is a valid lab category.
 *
 * @param category - The category string to validate
 * @returns True if the category is valid, false otherwise
 *
 * @example
 * isValidCategory("Lipid Panel") // returns true
 * isValidCategory("Invalid Category") // returns false
 */
export function isValidCategory(category: unknown): category is LabCategory {
	return typeof category === "string" && VALID_CATEGORIES.has(category);
}

/**
 * Gets a category from AI output with fallback to keyword-based classification.
 * This is the main function to use when processing lab components.
 *
 * @param aiCategory - The category provided by AI (may be null or invalid)
 * @param componentName - The name of the lab component for fallback classification
 * @returns A valid lab category
 *
 * @example
 * getCategoryWithFallback("Lipid Panel", "Cholesterol") // returns "Lipid Panel"
 * getCategoryWithFallback(null, "Cholesterol") // returns "Lipid Panel" (fallback)
 * getCategoryWithFallback("Invalid", "Cholesterol") // returns "Lipid Panel" (fallback)
 */
export function getCategoryWithFallback(aiCategory: string | null | undefined, componentName: string): LabCategory {
	// If AI provided a valid category, use it
	if (aiCategory && isValidCategory(aiCategory)) {
		return aiCategory;
	}

	// Otherwise, fall back to keyword-based classification
	return classifyComponentCategory(componentName);
}
