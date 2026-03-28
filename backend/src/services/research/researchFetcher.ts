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
}

const STOP_WORDS = new Set([
  "i","me","my","have","has","had","the","a","an","is","are","was","were",
  "what","how","why","when","can","could","should","would","tell","about",
  "feel","feeling","experiencing","suffering","help","please","thanks","and",
  "or","but","with","for","from","to","of","in","on","at","by","be","do",
  "does","did","get","got","am","it","this","that","these","those","some",
  "also","just","been","very","pain","since","days","weeks","want","need",
]);

export function extractKeywords(query: string): string[] {
  return [...new Set(
    query.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w))
  )].slice(0, 5);
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

    const summaryRes = await fetch(
      `${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`,
      { signal: AbortSignal.timeout(6000) }
    );
    const summaryData = await summaryRes.json();

    const papers: ResearchPaper[] = ids.map((id) => {
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
    }).filter(Boolean) as ResearchPaper[];

    // Best-effort abstract fetch
    try {
      const abstractRes = await fetch(
        `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${ids.join(",")}&rettype=abstract&retmode=xml`,
        { signal: AbortSignal.timeout(6000) }
      );
      const xml = await abstractRes.text();
      const matches = [...xml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)];
      matches.forEach((m, i) => {
        if (papers[i]) papers[i].abstract = m[1].replace(/<[^>]+>/g, "").trim().slice(0, 500) + "...";
      });
    } catch { /* abstracts optional */ }

    return papers;
  } catch (err) {
    logger.warn({ err }, "PubMed fetch failed");
    return [];
  }
}

async function fetchSemanticScholar(keywords: string[], max = 4): Promise<ResearchPaper[]> {
  if (!keywords.length) return [];
  try {
    const res = await fetch(
      `${SEMANTIC_SCHOLAR_BASE}/paper/search?query=${encodeURIComponent(keywords.join(" "))}&limit=${max}&fields=title,authors,year,abstract,externalIds,venue,citationCount`,
      { headers: { "User-Agent": "Niraksh-Guardian/1.0" }, signal: AbortSignal.timeout(6000) }
    );
    const data = await res.json();
    return (data?.data ?? []).map((p: any): ResearchPaper => ({
      id: `ss-${p.paperId}`,
      source: "Semantic Scholar",
      title: p.title || "Untitled",
      authors: (p.authors ?? []).slice(0, 3).map((a: { name: string }) => a.name),
      journal: p.venue || "",
      year: p.year?.toString() || "",
      abstract: p.abstract ? p.abstract.slice(0, 500) + "..." : "",
      url: `https://www.semanticscholar.org/paper/${p.paperId}`,
      citationCount: p.citationCount ?? 0,
    }));
  } catch (err) {
    logger.warn({ err }, "Semantic Scholar fetch failed");
    return [];
  }
}

export async function fetchResearchPapers(
  query: string,
  maxPerSource = 4
): Promise<{ papers: ResearchPaper[]; keywords: string[] }> {
  const keywords = extractKeywords(query);
  if (!keywords.length) return { papers: [], keywords: [] };

  const [pubmedResult, ssResult] = await Promise.allSettled([
    fetchPubMed(keywords, maxPerSource, " AND "),
    fetchSemanticScholar(keywords, maxPerSource),
  ]);

  let all = [
    ...(pubmedResult.status === "fulfilled" ? pubmedResult.value : []),
    ...(ssResult.status === "fulfilled" ? ssResult.value : []),
  ];

  if (all.length === 0 && keywords.length > 1) {
    all = await fetchPubMed(keywords, maxPerSource, " OR ");
  }

  const seen = new Set<string>();
  const unique = all.filter((p) => {
    const key = p.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { papers: unique, keywords };
}
