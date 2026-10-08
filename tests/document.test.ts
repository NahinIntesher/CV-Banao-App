import { test } from "node:test";
import assert from "node:assert/strict";
import { createCV, templates, emptyEntry } from "../src/lib/model";
import { documentHTML } from "../src/lib/document";
test("Every native document layout escapes user data and hides excluded sections", () => {
  for (const template of templates) {
    const cv = createCV(template.id);
    cv.profile.name = "<script>alert(1)</script>";
    cv.sections[0].title = "Private hidden section";
    cv.sections[0].visible = false;
    cv.sections[0].entries = [{ ...emptyEntry(), title: "Hidden entry" }];
    const html = documentHTML(cv, { regular: "AAAA", bold: "BBBB" });
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(!html.includes("<script>"));
    assert.ok(!html.includes("Private hidden section"));
    assert.ok(!html.includes("Hidden entry"));
    assert.ok(html.includes("data:font/ttf;base64,AAAA"));
  }
});
