import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { timingSafeEqual } from "node:crypto";
import { extractFile, pdfText } from "./extract";
import { GET, POST } from "./research-route";
export const app = express();
app.disable("x-powered-by");
app.use(
  cors({
    origin: process.env.WEB_ORIGIN ? process.env.WEB_ORIGIN.split(",") : false,
  }),
);
app.use(express.json({ limit: "600kb" }));
app.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("X-Content-Type-Options", "nosniff");
  next();
});
app.get("/health", (_req, res) =>
  res.json({
    ok: true,
    service: "CV Banao mobile API",
    aiConfigured: Boolean(
      process.env.OPENAI_API_KEY && process.env.CV_AI_ACCESS_CODE,
    ),
  }),
);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 3 },
});
let active = 0;
const hits = new Map<string, number[]>();
app.use("/api", (req, res, next) => {
  const code = process.env.CV_AI_ACCESS_CODE;
  if (!code)
    return void res
      .status(503)
      .json({ error: "Set CV_AI_ACCESS_CODE on the backend and restart." });
  const got = Buffer.from(String(req.headers["x-cv-access-code"] ?? "")),
    expected = Buffer.from(code);
  if (got.length !== expected.length || !timingSafeEqual(got, expected))
    return void res
      .status(401)
      .json({ error: "The workspace access code is incorrect." });
  const now = Date.now();
  for (const [k, v] of hits)
    if (v.every((t) => now - t > 3600000)) hits.delete(k);
  const ip = req.ip ?? "local";
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 3600000);
  if (list.length >= 40 || (hits.size >= 10000 && !hits.has(ip)))
    return void res
      .status(429)
      .json({ error: "Too many requests. Try again in an hour." });
  hits.set(ip, [...list, now]);
  next();
});
app.get("/api/status", (_req, res) =>
  res.json({
    service: "CV Banao mobile API",
    aiConfigured: Boolean(
      process.env.OPENAI_API_KEY && process.env.CV_AI_ACCESS_CODE,
    ),
  }),
);
app.post("/api/import", upload.single("file"), async (req, res) => {
  if (!req.file)
    return void res.status(400).json({ error: "Choose a file first." });
  if (active >= 2)
    return void res
      .status(429)
      .json({ error: "The importer is busy. Retry shortly." });
  active++;
  try {
    const result = await extractFile(req.file, req.body.ocr === "true");
    res.json(result);
  } catch (e) {
    res
      .status(422)
      .json({ error: e instanceof Error ? e.message : "Import failed." });
  } finally {
    active--;
  }
});
app.post("/api/research-extract", upload.single("file"), async (req, res) => {
  if (!req.file || !req.file.originalname.toLowerCase().endsWith(".pdf"))
    return void res.status(400).json({ error: "Choose a research PDF." });
  if (active >= 2)
    return void res
      .status(429)
      .json({ error: "The extractor is busy. Retry shortly." });
  active++;
  try {
    const result = await pdfText(req.file.buffer, false);
    res.json({
      name: req.file.originalname,
      text: result.text,
      pages: result.pages,
    });
  } catch (e) {
    res.status(422).json({
      error: e instanceof Error ? e.message : "Could not extract PDF.",
    });
  } finally {
    active--;
  }
});
app.get("/api/research-summary", async (_req, res) => {
  const response = await GET();
  res.status(response.status).json(await response.json());
});
app.post("/api/research-summary", async (req, res) => {
  try {
    const request = new Request(
      `${req.protocol}://${req.get("host")}/api/research-summary`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-cv-access-code": String(req.headers["x-cv-access-code"] ?? ""),
          "x-forwarded-for": req.ip ?? "local",
        },
        body: JSON.stringify(req.body),
      },
    );
    const response = await POST(request);
    res.status(response.status).json(await response.json());
  } catch {
    res.status(502).json({ error: "Could not generate the research summary." });
  }
});
app.use(
  (
    error: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res.status(error?.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
      error:
        error?.code === "LIMIT_FILE_SIZE"
          ? "Choose a file up to 10 MB."
          : "The request could not be processed.",
    });
  },
);
if (process.env.NODE_ENV !== "test")
  app.listen(Number(process.env.PORT ?? 4000), "0.0.0.0", () =>
    console.log(`CV Banao API on port ${process.env.PORT ?? 4000}`),
  );
