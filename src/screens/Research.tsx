import React, { useEffect, useRef, useState } from "react";
import { BookOpen, Plus, Upload } from "lucide-react-native";
import { useBanao } from "../lib/store";
import {
  createSection,
  emptyEntry,
  filledEntry,
  purposeOf,
} from "../lib/model";
import { PDFSource, ResearchSummary, validateSummary } from "../lib/research";
import { pickFile } from "../lib/files";
import { request, upload } from "../lib/api";
import {
  Button,
  Card,
  CheckRow,
  Choice,
  Field,
  Heading,
  Label,
} from "../components/UI";
export default function Research() {
  const { state, accessCode, cv, patch, notify, theme: t } = useBanao();
  const [source, setSource] = useState<PDFSource | null>(null),
    [result, setResult] = useState<ResearchSummary | null>(null),
    [relationship, setRelationship] = useState("literature"),
    [role, setRole] = useState(""),
    [length, setLength] = useState("concise"),
    [target, setTarget] = useState("literature"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [sourceOpen, setSourceOpen] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const read = async () => {
    try {
      const file = await pickFile();
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".pdf"))
        throw Error("Choose a research PDF.");
      setBusy(true);
      setError("");
      abort.current = new AbortController();
      const data = await upload(
        state.backendURL,
        accessCode,
        "/api/research-extract",
        file,
        false,
        abort.current.signal,
      );
      if (
        !data ||
        typeof data.text !== "string" ||
        data.text.length > 120000 ||
        !Number.isInteger(data.pages)
      )
        throw Error("Invalid PDF extraction result.");
      setSource(data);
      setResult(null);
      setConfirmed(false);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const generate = async () => {
    if (!source) return;
    setBusy(true);
    setError("");
    abort.current = new AbortController();
    try {
      const data = await request(
        state.backendURL,
        accessCode,
        "/api/research-summary",
        { source, purpose: purposeOf(cv.template), relationship, role, length },
        abort.current.signal,
      );
      setResult(validateSummary(data.result ?? data.summary ?? data, source));
      setConfirmed(false);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const add = () => {
    if (!result || !confirmed) return;
    const title =
      target === "publication"
        ? "Publications"
        : target === "research"
          ? "Research experience"
          : "Literature review";
    const entry = {
      ...emptyEntry(),
      title: result.title,
      subtitle:
        target === "publication"
          ? [result.authors, result.venue, result.publicationStatus]
              .filter(Boolean)
              .join(" · ")
          : relationship === "my_work"
            ? role
            : "Literature review",
      date: result.year,
      url: result.url,
      description:
        target === "publication"
          ? result.summary
          : result.bullets.map((b) => "- " + b.text).join("\n"),
    };
    const existing = cv.sections.find(
      (s) => s.title.toLowerCase() === title.toLowerCase(),
    );
    if (
      (existing && existing.entries.length >= 100) ||
      (!existing && cv.sections.length >= 40)
    )
      return notify("Section or entry limit reached.");
    if (existing)
      patch({
        sections: cv.sections.map((s) =>
          s.id === existing.id
            ? {
                ...s,
                visible: true,
                entries: [...s.entries.filter(filledEntry), entry],
              }
            : s,
        ),
      });
    else {
      const section = createSection(
        title,
        target === "publication" ? "publications" : "experience",
      );
      section.entries = [entry];
      patch({ sections: [...cv.sections, section] });
    }
    notify("Reviewed research entry added to your CV.");
    setConfirmed(false);
  };
  return (
    <>
      <Heading
        icon={BookOpen}
        title="From paper to possibility."
        description="Upload research papers or reports. Turn the evidence into clear, editable CV wording."
      />
      <Card>
        <Label size={12} muted>
          Research extraction and AI summaries use your configured backend.
          Generating a summary sends extracted text and your stated contribution
          to OpenAI through the server. Review the wording before adding it.
        </Label>
        <Button
          icon={Upload}
          style={{ marginTop: 20 }}
          loading={busy && !source}
          disabled={busy}
          onPress={() => void read()}
        >
          Choose a research PDF
        </Button>
        {source && (
          <>
            <Label size={16} bold style={{ marginTop: 22 }}>
              {source.name}
            </Label>
            <Label size={11} muted>
              {source.pages} pages · {source.text.length.toLocaleString()}{" "}
              characters extracted
            </Label>
            <Button subtle onPress={() => setSourceOpen(!sourceOpen)}>
              {sourceOpen ? "Hide source text" : "Review source text"}
            </Button>
            {sourceOpen && (
              <Label size={11} muted>
                {source.text}
              </Label>
            )}
            <Choice
              label="Your relationship to this work"
              value={relationship}
              options={[
                { id: "literature", name: "I read / reviewed this work" },
                { id: "my_work", name: "I contributed to this work" },
              ]}
              onChange={(v) => {
                setRelationship(v);
                setTarget(v === "my_work" ? "research" : "literature");
                setConfirmed(false);
                setResult(null);
              }}
            />
            {relationship === "my_work" && (
              <Field
                label="Your actual contribution"
                multiline
                value={role}
                maxLength={3000}
                onChangeText={(v) => {
                  setRole(v);
                  setConfirmed(false);
                  setResult(null);
                }}
                placeholder="Describe what you personally did. Be specific."
              />
            )}
            <Choice
              label="Summary length"
              value={length}
              options={[
                { id: "concise", name: "Concise · 2–3 bullets" },
                { id: "detailed", name: "Detailed · 3–5 bullets" },
              ]}
              onChange={setLength}
            />
            <Button
              style={{ marginTop: 22 }}
              loading={busy && !!source}
              disabled={
                busy || (relationship === "my_work" && role.trim().length < 15)
              }
              onPress={() => void generate()}
            >
              Generate CV wording
            </Button>
          </>
        )}
        {busy && (
          <Button subtle onPress={() => abort.current?.abort()}>
            Cancel request
          </Button>
        )}
      </Card>
      {error && (
        <Card style={{ borderColor: t.danger }}>
          <Label size={12} color={t.danger}>
            {error}
          </Label>
        </Card>
      )}
      {result && (
        <>
          <Card>
            <Label size={20} bold>
              Your editable research draft
            </Label>
            {[
              ["title", "Paper / project title"],
              ["authors", "Authors"],
              ["year", "Year"],
              ["venue", "Venue"],
              ["publicationStatus", "Publication status"],
              ["url", "Link"],
            ].map(([key, label]) => (
              <Field
                key={key}
                label={label}
                value={result[key as keyof ResearchSummary] as string}
                maxLength={5000}
                onChangeText={(value) => {
                  setResult({ ...result, [key]: value });
                  setConfirmed(false);
                }}
              />
            ))}
            <Field
              label="Neutral study summary"
              multiline
              value={result.summary}
              maxLength={5000}
              onChangeText={(summary) => {
                setResult({ ...result, summary });
                setConfirmed(false);
              }}
            />
          </Card>
          {result.bullets.map((b, i) => (
            <Card key={i}>
              <Field
                label={`CV bullet ${i + 1}`}
                multiline
                value={b.text}
                maxLength={1000}
                onChangeText={(text) => {
                  setResult({
                    ...result,
                    bullets: result.bullets.map((x, j) =>
                      j === i ? { ...x, text } : x,
                    ),
                  });
                  setConfirmed(false);
                }}
              />
              <Label size={10} bold color={t.accent}>
                SOURCE EVIDENCE · PAGE {b.page}
              </Label>
              <Label size={11} muted style={{ marginTop: 7 }}>
                {b.evidence}
              </Label>
            </Card>
          ))}
          {!!result.cautions.length && (
            <Card>
              <Label size={14} bold>
                Review notes
              </Label>
              {result.cautions.map((c, i) => (
                <Label key={i} size={11} muted style={{ marginTop: 9 }}>
                  • {c}
                </Label>
              ))}
            </Card>
          )}
          <Card>
            <Choice
              label="Add to CV section"
              value={target}
              options={
                relationship === "my_work"
                  ? [
                      { id: "research", name: "Research experience" },
                      { id: "publication", name: "Publications" },
                      { id: "literature", name: "Literature review" },
                    ]
                  : [{ id: "literature", name: "Literature review" }]
              }
              onChange={setTarget}
            />
            <CheckRow
              label="I reviewed accuracy, source evidence and my own contribution."
              checked={confirmed}
              onPress={() => setConfirmed(!confirmed)}
            />
            <Button icon={Plus} disabled={!confirmed} onPress={add}>
              Add reviewed entry to CV
            </Button>
          </Card>
        </>
      )}
    </>
  );
}
