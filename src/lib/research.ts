export interface ResearchBullet {
  text: string;
  evidence: string;
  page: number;
}
export interface ResearchSummary {
  title: string;
  authors: string;
  year: string;
  venue: string;
  url: string;
  publicationStatus: string;
  summary: string;
  bullets: ResearchBullet[];
  methods: string[];
  cautions: string[];
}
export interface PDFSource {
  name: string;
  text: string;
  pages: number;
}
export const PDF_LIMITS = {
  files: 3,
  bytes: 10 * 1024 * 1024,
  pages: 60,
  characters: 120000,
};
export const normalize = (s: string) =>
  s.replace(/\s+/g, " ").trim().toLowerCase();
export function validateSummary(
  raw: unknown,
  source: PDFSource,
): ResearchSummary {
  const fail = () => {
    throw new Error("The AI returned an incomplete result. Please try again.");
  };
  if (!raw || typeof raw !== "object") return fail();
  const r = raw as ResearchSummary;
  for (const key of [
    "title",
    "authors",
    "year",
    "venue",
    "url",
    "publicationStatus",
    "summary",
  ] as const)
    if (typeof r[key] !== "string" || r[key].length > 5000) return fail();
  if (
    !Array.isArray(r.bullets) ||
    r.bullets.length > 6 ||
    !Array.isArray(r.methods) ||
    !Array.isArray(r.cautions)
  )
    return fail();
  if (
    [...r.methods, ...r.cautions].some(
      (s) => typeof s !== "string" || s.length > 2000,
    )
  )
    return fail();
  const cautions = r.cautions.slice(0, 10);
  const valid: ResearchBullet[] = [];
  for (const b of r.bullets) {
    if (
      !b ||
      typeof b.text !== "string" ||
      typeof b.evidence !== "string" ||
      b.text.length > 1000 ||
      b.evidence.length > 600 ||
      !Number.isInteger(b.page) ||
      b.page < 1 ||
      b.page > source.pages
    )
      return fail();
    const pageText =
      source.text.split(`[Page ${b.page}]`)[1]?.split(/\[Page \d+\]/)[0] ?? "";
    if (
      b.evidence.trim().length < 15 ||
      !normalize(pageText).includes(normalize(b.evidence))
    ) {
      cautions.push(
        "A bullet was omitted because its supporting passage could not be located on the cited page.",
      );
      continue;
    }
    valid.push(b);
  }
  if (!valid.length)
    throw new Error(
      "No source-supported bullets could be verified. Try a text-based PDF with a clear abstract and results section.",
    );
  return { ...r, bullets: valid, cautions: [...new Set(cautions)] };
}
