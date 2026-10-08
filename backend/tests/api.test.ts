import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { extractFile, pdfText } from "../src/extract";
test("PDF, DOCX and English scanned PDF preserve source text", async () => {
  for (const name of ["import-fixture.pdf", "import-fixture.docx"]) {
    const result = await extractFile(
      {
        originalname: name,
        buffer: await readFile(new URL("./fixtures/" + name, import.meta.url)),
      },
      false,
    );
    assert.ok(result.source.length > 100);
    assert.ok(result.cv.profile.email.includes("@"));
  }
  const scan = await pdfText(
    await readFile(new URL("./fixtures/scanned-cv.pdf", import.meta.url)),
    true,
  );
  assert.ok(scan.text.length > 100);
  assert.ok(scan.text.includes("@"));
});
test("Invalid PDF is rejected before parsing", async () => {
  await assert.rejects(
    extractFile({ originalname: "bad.pdf", buffer: Buffer.from("bad") }, false),
    /header/,
  );
});
test("Backend requires access code and imports a real PDF over multipart HTTP", async () => {
  process.env.NODE_ENV = "test";
  process.env.CV_AI_ACCESS_CODE = "test-only-code";
  const { app } = await import("../src/server");
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const addr = server.address() as { port: number };
  const base = `http://127.0.0.1:${addr.port}`;
  try {
    assert.equal((await fetch(base + "/health")).status, 200);
    assert.equal((await fetch(base + "/api/status")).status, 401);
    const headers = { "x-cv-access-code": "test-only-code" };
    assert.equal((await fetch(base + "/api/status", { headers })).status, 200);
    const form = new FormData();
    form.append(
      "file",
      new Blob([
        await readFile(
          new URL("./fixtures/import-fixture.pdf", import.meta.url),
        ),
      ]),
      "cv.pdf",
    );
    const response = await fetch(base + "/api/import", {
      method: "POST",
      headers,
      body: form,
    });
    assert.equal(response.status, 200);
    assert.ok((await response.json()).cv.profile.email.includes("@"));
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
  }
});
