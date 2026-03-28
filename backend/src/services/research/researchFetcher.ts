import { generateContent } from "../ai/gemini";
import env from "../../config/env";
import logger from "../../config/logger";

const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const SEMANTIC_SCHOLAR_BASE = "https://api.semanticscholar.org/graph/v1";

export interface ResearchPaper {
	id: string;
	source: "PubMed" | "Semantic Scholar";
	title: string;
	authors: string[];
	journal: string;
	year: string;
	abstract: string;
	url: string;
	citationCount?: number;
	retrievalScore?: number;
	retrievalSignals?: string[];
}

export interface ResearchRagSummary {
	enabled: boolean;
	method: "semantic+lexical" | "lexical";
	confidence: "high" | "medium" | "low";
	summary: string;
	citations: string[];
}

export interface ResearchRetrievalMetadata {
	totalCandidates: number;
	returned: number;
	keywordJoinerUsed: "AND" | "OR";
	embeddingsUsed: boolean;
}

export interface FetchResearchResponse {
	papers: ResearchPaper[];
	keywords: string[];
	rag: ResearchRagSummary;
	metadata: ResearchRetrievalMetadata;
}

const STOP_WORDS = new Set([
	"i",
	"me",
	"my",
	"have",
	"has",
	"had",
	"the",
	"a",
	"an",
	"is",
	"are",
	"was",
	"were",
	"what",
	"how",
	"why",
	"when",
	"can",
	"could",
	"should",
	"would",
	"tell",
	"about",
	"feel",
	"feeling",
	"experiencing",
	"suffering",
	"help",
	"please",
	"thanks",
	"and",
	"or",
	"but",
	"with",
	"for",
	"from",
	"to",
	"of",
	"in",
	"on",
	"at",
	"by",
	"be",
	"do",
	"does",
	"did",
	"get",
	"got",
	"am",
	"it",
	"this",
	"that",
	"these",
	"those",
	"some",
	"also",
	"just",
	"been",
	"very",
	"pain",
	"since",
	"days",
	"weeks",
	"want",
	"need",
]);

export function extractKeywords(query: string): string[] {
	const cleaned = query
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.split(/\s+/)
		.filter(Boolean);

	// Keep short medically meaningful tokens like hiv, tb, flu and h1n1.
	const medicallyRelevantShortWords = new Set(["hiv", "tb", "flu", "covid", "h1n1", "aids"]);

	return [
		...new Set(
			cleaned.filter(
				(w) => !STOP_WORDS.has(w) && (w.length >= 4 || medicallyRelevantShortWords.has(w) || /\d/.test(w))
			)
		),
	].slice(0, 5);
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePubmedAbstractById(xml: string, pubmedId: string): string {
	const articlePattern = new RegExp(
		`<PubmedArticle>[\\s\\S]*?<PMID[^>]*>${escapeRegExp(pubmedId)}<\\/PMID>[\\s\\S]*?<Abstract>([\\s\\S]*?)<\\/Abstract>[\\s\\S]*?<\\/PubmedArticle>`,
		"i"
	);
	const articleMatch = xml.match(articlePattern);
	if (!articleMatch) return "";

	const abstractSection = articleMatch[1];
	const parts = [...abstractSection.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)]
		.map((m) => m[1].replace(/<[^>]+>/g, "").trim())
		.filter(Boolean);

	if (!parts.length) return "";
	const merged = parts.join(" ").replace(/\s+/g, " ").trim();
	return merged.slice(0, 700);
}

function buildRetrievalText(paper: ResearchPaper): string {
	const authorText = paper.authors.slice(0, 3).join(", ");
	return [paper.title, authorText, paper.journal, paper.abstract].filter(Boolean).join(". ");
}

function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, " ")
		.split(/\s+/)
		.filter(Boolean);
}

function lexicalSimilarity(query: string, paper: ResearchPaper): { score: number; signals: string[] } {
	const queryTokens = Array.from(new Set(tokenize(query))).filter((t) => t.length >= 2);
	const titleTokens = new Set(tokenize(paper.title));
	const abstractTokens = new Set(tokenize(paper.abstract));
	const journalTokens = new Set(tokenize(paper.journal));

	let score = 0;
	const signals: string[] = [];

	for (const token of queryTokens) {
		if (titleTokens.has(token)) {
			score += 2.2;
			signals.push(`title:${token}`);
			continue;
		}
		if (abstractTokens.has(token)) {
			score += 1.3;
			signals.push(`abstract:${token}`);
			continue;
		}
		if (journalTokens.has(token)) {
			score += 0.6;
			signals.push(`journal:${token}`);
		}
	}

	if (paper.citationCount && paper.citationCount > 0) {
		score += Math.min(1, Math.log10(paper.citationCount + 1) / 4);
	}

	const maxPossible = queryTokens.length * 2.2 + 1;
	const normalised = Math.min(1, maxPossible > 0 ? score / maxPossible : 0);
	return { score: normalised, signals: signals.slice(0, 6) };
}

function cosineSimilarity(a: number[], b: number[]): number {
	if (!a.length || !b.length || a.length !== b.length) return 0;
	let dot = 0;
	let normA = 0;
	let normB = 0;
	for (let i = 0; i < a.length; i += 1) {
		dot += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}
	if (normA === 0 || normB === 0) return 0;
	return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function fetchEmbedding(
	text: string,
	taskType: "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT"
): Promise<number[] | null> {
	const apiKey = env.GEMINI_API_KEY;
	if (!apiKey) return null;
	const embeddingModels = ["text-embedding-004", "gemini-embedding-001"];

	for (const modelName of embeddingModels) {
		try {
			const response = await fetch(
				`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${encodeURIComponent(apiKey)}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						taskType,
						content: {
							parts: [{ text: text.slice(0, 8000) }],
						},
					}),
					signal: AbortSignal.timeout(8000),
				}
			);

			if (!response.ok) {
				if (response.status !== 404) {
					logger.warn({ status: response.status, modelName }, "Embedding request failed");
				}
				continue;
			}

			const payload = (await response.json()) as {
				embedding?: { values?: number[] };
			};
			if (Array.isArray(payload.embedding?.values) && payload.embedding.values.length > 0) {
				return payload.embedding.values;
			}
		} catch (err) {
			logger.warn({ err, modelName }, "Embedding call errored");
		}
	}

	return null;
}

function extractJsonObject(raw: string): string | null {
	const cleaned = raw
		.replace(/```json/g, "")
		.replace(/```/g, "")
		.trim();
	const match = cleaned.match(/\{[\s\S]*\}/);
	return match ? match[0] : null;
}

async function scorePapersWithLlm(
	query: string,
	papers: ResearchPaper[]
): Promise<Map<string, { score: number; reason: string }>> {
	if (!env.GEMINI_API_KEY || !papers.length) return new Map();

	const prompt = `
You are ranking biomedical papers for relevance.

User Query: ${query}

Return JSON only with this exact schema:
{
  "scores": [
    { "id": "paper-id", "score": 0.0-1.0, "reason": "short reason" }
  ]
}

Scoring criteria:
- clinical relevance to query intent
- mechanistic relevance and treatment specificity
- evidence quality implied by title/abstract

Papers:
${papers
	.map(
		(p, i) =>
			`${i + 1}. id=${p.id}\nTitle: ${p.title}\nAbstract: ${(p.abstract || "").slice(0, 500)}\nJournal: ${p.journal}\nYear: ${p.year}\n`
	)
	.join("\n")}
`;

	try {
		const result = await generateContent(prompt);
		const parsedJson = extractJsonObject(result);
		if (!parsedJson) return new Map();

		const parsed = JSON.parse(parsedJson) as {
			scores?: Array<{ id: string; score: number; reason?: string }>;
		};

		const map = new Map<string, { score: number; reason: string }>();
		for (const item of parsed.scores ?? []) {
			if (!item?.id) continue;
			const bounded = Math.max(0, Math.min(1, Number(item.score) || 0));
			map.set(item.id, { score: bounded, reason: item.reason?.slice(0, 120) || "semantic match" });
		}
		return map;
	} catch (err) {
		logger.warn({ err }, "LLM semantic scoring failed");
		return new Map();
	}
}

async function rankPapersByRag(
	query: string,
	papers: ResearchPaper[]
): Promise<{ ranked: ResearchPaper[]; embeddingsUsed: boolean }> {
	if (!papers.length) return { ranked: [], embeddingsUsed: false };

	const queryLexical = query.toLowerCase();
	const lexicalScores = papers.map((paper) => lexicalSimilarity(queryLexical, paper));

	const queryEmbedding = await fetchEmbedding(query, "RETRIEVAL_QUERY");
	if (!queryEmbedding) {
		const llmScores = await scorePapersWithLlm(query, papers);
		const rankedLexical = papers
			.map((paper, idx) => ({
				llm: llmScores.get(paper.id),
				...paper,
				retrievalScore: Number(
					(
						(llmScores.get(paper.id)?.score ?? lexicalScores[idx].score) * 0.7 +
						lexicalScores[idx].score * 0.3
					).toFixed(4)
				),
				retrievalSignals: [
					...(lexicalScores[idx].signals ?? []),
					...(llmScores.get(paper.id)?.reason ? [`semantic:${llmScores.get(paper.id)?.reason}`] : []),
				].slice(0, 6),
			}))
			.sort((a, b) => (b.retrievalScore ?? 0) - (a.retrievalScore ?? 0));
		return { ranked: rankedLexical, embeddingsUsed: llmScores.size > 0 };
	}

	const docEmbeddings = await Promise.all(
		papers.map((paper) => fetchEmbedding(buildRetrievalText(paper), "RETRIEVAL_DOCUMENT"))
	);

	const ranked = papers
		.map((paper, idx) => {
			const semanticRaw = docEmbeddings[idx]
				? cosineSimilarity(queryEmbedding, docEmbeddings[idx] as number[])
				: 0;
			const semanticNormalised = Math.max(0, Math.min(1, (semanticRaw + 1) / 2));
			const lexical = lexicalScores[idx].score;
			const blended = semanticNormalised * 0.75 + lexical * 0.25;

			return {
				...paper,
				retrievalScore: Number(blended.toFixed(4)),
				retrievalSignals: lexicalScores[idx].signals,
			};
		})
		.sort((a, b) => (b.retrievalScore ?? 0) - (a.retrievalScore ?? 0));

	return { ranked, embeddingsUsed: true };
}

async function generateGroundedSummary(query: string, topPapers: ResearchPaper[]): Promise<ResearchRagSummary> {
	if (!topPapers.length) {
		return {
			enabled: false,
			method: env.GEMINI_API_KEY ? "semantic+lexical" : "lexical",
			confidence: "low",
			summary: "No directly relevant research evidence was retrieved for this query.",
			citations: [],
		};
	}

	const averageScore = topPapers.reduce((sum, p) => sum + (p.retrievalScore ?? 0), 0) / Math.max(1, topPapers.length);
	const confidence: "high" | "medium" | "low" =
		averageScore >= 0.72 ? "high" : averageScore >= 0.48 ? "medium" : "low";

	if (!env.GEMINI_API_KEY) {
		return {
			enabled: false,
			method: "lexical",
			confidence,
			summary: "Evidence retrieved. AI synthesis unavailable because GEMINI_API_KEY is not configured.",
			citations: topPapers.map((p) => p.id),
		};
	}

	const contextBlock = topPapers
		.map((paper, i) => {
			const idx = i + 1;
			return `[#${idx}] ${paper.title}\nSource: ${paper.source} (${paper.year || "n/a"})\nJournal: ${paper.journal || "n/a"}\nURL: ${paper.url}\nAbstract: ${paper.abstract || "Not available"}`;
		})
		.join("\n\n");

	try {
		const summary = await generateContent(`
You are a biomedical research assistant.
Task: Given the user query and retrieved evidence, produce a concise evidence-grounded summary.

Rules:
- Use only the evidence provided.
- Do not invent findings.
- Mention uncertainty where evidence is weak.
- Add inline citations as [#1], [#2], etc.
- Keep output to 4-6 bullet points.

User query: ${query}

Evidence:
${contextBlock}
`);

		return {
			enabled: true,
			method: "semantic+lexical",
			confidence,
			summary: summary.trim(),
			citations: topPapers.map((p) => p.id),
		};
	} catch (err) {
		logger.warn({ err }, "RAG summary generation failed");
		return {
			enabled: false,
			method: "semantic+lexical",
			confidence,
			summary: "Evidence retrieved, but AI synthesis failed. You can still review the ranked papers below.",
			citations: topPapers.map((p) => p.id),
		};
	}
}

async function fetchPubMed(keywords: string[], max = 4, joiner = " AND "): Promise<ResearchPaper[]> {
	if (!keywords.length) return [];
	const query = keywords.join(joiner);
	try {
		const searchRes = await fetch(
			`${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${max}&retmode=json&sort=relevance`,
			{ signal: AbortSignal.timeout(6000) }
		);
		const { esearchresult } = await searchRes.json();
		const ids: string[] = esearchresult?.idlist ?? [];
		if (!ids.length) return [];

		const summaryRes = await fetch(`${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`, {
			signal: AbortSignal.timeout(6000),
		});
		const summaryData = await summaryRes.json();

		const papers: ResearchPaper[] = ids
			.map((id) => {
				const item = summaryData?.result?.[id];
				if (!item) return null;
				return {
					id: `pubmed-${id}`,
					source: "PubMed" as const,
					title: item.title || "Untitled",
					authors: (item.authors ?? []).slice(0, 3).map((a: { name: string }) => a.name),
					journal: item.fulljournalname || item.source || "",
					year: (item.pubdate || "").split(" ")[0] || "",
					abstract: "",
					url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
				};
			})
			.filter(Boolean) as ResearchPaper[];

		// Best-effort abstract fetch
		try {
			const abstractRes = await fetch(
				`${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${ids.join(",")}&rettype=abstract&retmode=xml`,
				{ signal: AbortSignal.timeout(6000) }
			);
			const xml = await abstractRes.text();
			for (const id of ids) {
				const paper = papers.find((p) => p.id === `pubmed-${id}`);
				if (!paper) continue;
				const abstractText = parsePubmedAbstractById(xml, id);
				paper.abstract = abstractText ? `${abstractText}${abstractText.endsWith(".") ? "" : "..."}` : "";
			}
		} catch {
			/* abstracts optional */
		}

		return papers;
	} catch (err) {
		logger.warn({ err }, "PubMed fetch failed");
		return [];
	}
}

interface SemanticScholarAuthor {
	name?: string;
}

interface SemanticScholarPaper {
	paperId?: string;
	title?: string;
	authors?: SemanticScholarAuthor[];
	venue?: string;
	year?: number;
	abstract?: string;
	citationCount?: number;
}

interface SemanticScholarResponse {
	data?: SemanticScholarPaper[];
}

async function fetchSemanticScholar(keywords: string[], max = 4): Promise<ResearchPaper[]> {
	if (!keywords.length) return [];
	try {
		const res = await fetch(
			`${SEMANTIC_SCHOLAR_BASE}/paper/search?query=${encodeURIComponent(keywords.join(" "))}&limit=${max}&fields=title,authors,year,abstract,externalIds,venue,citationCount`,
			{ headers: { "User-Agent": "Niraksh-Guardian/1.0" }, signal: AbortSignal.timeout(6000) }
		);
		const data = (await res.json()) as SemanticScholarResponse;
		return (data?.data ?? []).map(
			(p): ResearchPaper => ({
				id: `ss-${p.paperId ?? "unknown"}`,
				source: "Semantic Scholar",
				title: p.title || "Untitled",
				authors: (p.authors ?? [])
					.map((a) => a.name)
					.filter((name): name is string => Boolean(name))
					.slice(0, 3),
				journal: p.venue || "",
				year: p.year?.toString() || "",
				abstract: p.abstract ? p.abstract.slice(0, 500) + "..." : "",
				url: `https://www.semanticscholar.org/paper/${p.paperId}`,
				citationCount: p.citationCount ?? 0,
			})
		);
	} catch (err) {
		logger.warn({ err }, "Semantic Scholar fetch failed");
		return [];
	}
}

export async function fetchResearchPapers(query: string, maxPerSource = 4): Promise<FetchResearchResponse> {
	const keywords = extractKeywords(query);
	if (!keywords.length) {
		return {
			papers: [],
			keywords: [],
			rag: {
				enabled: false,
				method: "lexical",
				confidence: "low",
				summary: "Add more specific medical terms to retrieve relevant research evidence.",
				citations: [],
			},
			metadata: {
				totalCandidates: 0,
				returned: 0,
				keywordJoinerUsed: "AND",
				embeddingsUsed: false,
			},
		};
	}

	const candidateLimit = Math.max(8, maxPerSource * 3);

	const [pubmedResult, ssResult] = await Promise.allSettled([
		fetchPubMed(keywords, candidateLimit, " AND "),
		fetchSemanticScholar(keywords, candidateLimit),
	]);

	let all = [
		...(pubmedResult.status === "fulfilled" ? pubmedResult.value : []),
		...(ssResult.status === "fulfilled" ? ssResult.value : []),
	];

	let joinerUsed: "AND" | "OR" = "AND";

	if (all.length === 0 && keywords.length > 1) {
		all = await fetchPubMed(keywords, candidateLimit, " OR ");
		joinerUsed = "OR";
	}

	const seen = new Set<string>();
	const unique = all.filter((p) => {
		const key = p.title.toLowerCase().slice(0, 60);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});

	const { ranked, embeddingsUsed } = await rankPapersByRag(query, unique);
	const finalPapers = ranked.slice(0, maxPerSource);
	const rag = await generateGroundedSummary(query, finalPapers);

	return {
		papers: finalPapers,
		keywords,
		rag,
		metadata: {
			totalCandidates: unique.length,
			returned: finalPapers.length,
			keywordJoinerUsed: joinerUsed,
			embeddingsUsed,
		},
	};
}
