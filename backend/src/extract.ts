import { createCanvas, DOMMatrix, Path2D, ImageData } from "@napi-rs/canvas";
import { createWorker, OEM } from "tesseract.js";
import path from "node:path";
import { createRequire } from "node:module";
import JSZip from "jszip";
import {
  IMPORT_LIMIT,
  parseCVText,
  importBackup,
} from "../../src/lib/import-cv";
import { checkDocx } from "./zip-safety";
const require = createRequire(import.meta.url);
// PDF.js uses the native canvas shim when OCR rasterization is needed.
Object.assign(globalThis, { DOMMatrix, Path2D, ImageData });
export async function pdfText(bytes: Uint8Array, ocr = false) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
  });
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  try {
    const doc = await task.promise;
    if (doc.numPages > 60) throw new Error("Use up to 60 searchable pages.");
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let lines = "";
      for (const item of content.items)
        if ("str" in item) lines += item.str + (item.hasEOL ? "\n" : " ");
      if (lines.trim().length < 30 && ocr) {
        if (doc.numPages > 12)
          throw new Error("OCR supports up to 12 scanned pages.");
        if (!worker)
          worker = await createWorker("eng", OEM.LSTM_ONLY, {
            langPath: path.dirname(
              require.resolve("@tesseract.js-data/eng/4.0.0/eng.traineddata.gz"),
            ),
            cachePath: path.resolve(".ocr-cache"),
            logger: () => {},
          });
        const viewport = page.getViewport({ scale: 1.8 });
        if (
          viewport.width * viewport.height > 16000000 ||
          viewport.width > 8000 ||
          viewport.height > 8000
        )
          throw new Error(
            "Scanned page is too large; resize to a standard document page.",
          );
        const canvas = createCanvas(
          Math.ceil(viewport.width),
          Math.ceil(viewport.height),
        );
        await page.render({
          canvas: canvas as any,
          canvasContext: canvas.getContext("2d") as any,
          viewport,
        }).promise;
        lines = (await worker.recognize(canvas.toBuffer("image/png"))).data
          .text;
      }
      text += `[Page ${i}]\n${lines}\n`;
      if (text.length > IMPORT_LIMIT)
        throw new Error("The document exceeds 120,000 characters.");
      page.cleanup();
    }
    if (text.replace(/\[Page \d+\]/g, "").trim().length < 30)
      throw new Error(
        "No readable text found. Enable English OCR for scanned PDFs.",
      );
    return { text, pages: doc.numPages };
  } finally {
    if (worker) await worker.terminate();
    await task.destroy();
  }
}
export async function extractFile(
  file: { originalname: string; buffer: Buffer },
  ocr: boolean,
) {
  const ext = file.originalname.split(".").pop()?.toLowerCase();
  let source = "";
  if (ext === "json") {
    if (file.buffer.length > 2000000)
      throw new Error("JSON backups must be under 2 MB.");
    const cv = importBackup(file.buffer.toString("utf8"));
    return {
      cv,
      source: JSON.stringify(cv).slice(0, IMPORT_LIMIT),
      type: "JSON",
    };
  }
  if (ext === "pdf") {
    if (!file.buffer.subarray(0, 1024).toString().includes("%PDF-"))
      throw new Error("Invalid PDF header.");
    source = (await pdfText(file.buffer, ocr)).text;
  } else if (ext === "docx") {
    checkDocx(file.buffer);
    const zip = await JSZip.loadAsync(file.buffer);
    const xml = await zip.file("word/document.xml")?.async("string");
    if (!xml || xml.length > 5000000)
      throw new Error("DOCX content is empty or too large.");
    const decode = (s: string) =>
      s
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
          String.fromCodePoint(parseInt(n, 16)),
        )
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&");
    source = [...xml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)]
      .map((p) =>
        [...p[0].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
          .map((t) => decode(t[1]))
          .join(""),
      )
      .join("\n");
  } else if (ext === "txt") source = file.buffer.toString("utf8");
  else throw new Error("Choose PDF, DOCX, TXT or JSON.");
  return { cv: parseCVText(source), source, type: ext!.toUpperCase() };
}
