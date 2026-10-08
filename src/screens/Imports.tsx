import React, { useEffect, useRef, useState } from "react";
import { View, Pressable } from "react-native";
import {
  FileText,
  FolderOpen,
  ScanText,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react-native";
import { useBanao } from "../lib/store";
import { CV, emptyEntry, uid, validateCV } from "../lib/model";
import {
  ImportRecord,
  IMPORT_LIMIT,
  buildFromImport,
  importBackup,
  parseCVText,
  profileKeys,
  profileLabels,
} from "../lib/import-cv";
import { clone } from "../lib/clone";
import { pickFile, readPicked } from "../lib/files";
import { upload } from "../lib/api";
import { Selection } from "../components/NewCV";
import {
  Button,
  Card,
  Field,
  Heading,
  IconButton,
  Label,
  Row,
  Sheet,
  Toggle,
} from "../components/UI";
export default function Imports({ onUpdated }: { onUpdated: () => void }) {
  const {
    state,
    setWorkspace,
    cv,
    commit,
    notify,
    theme: t,
    accessCode,
  } = useBanao();
  const [mode, setMode] = useState("file"),
    [text, setText] = useState(""),
    [review, setReview] = useState<ImportRecord | null>(null),
    [selected, setSelected] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [expanded, setExpanded] = useState<string[]>([]),
    [sourceOpen, setSourceOpen] = useState(false),
    [confirm, setConfirm] = useState(false),
    [deleteId, setDeleteId] = useState("");
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const open = (item: ImportRecord) => {
    setReview(clone(item));
    setSelected([
      "profile",
      "summary",
      ...item.cv.sections
        .filter((s) => !s.title.startsWith("Unassigned information"))
        .map((s) => s.id),
    ]);
    setExpanded(item.cv.sections.slice(0, 1).map((s) => s.id));
    setError("");
    setConfirm(false);
  };
  const begin = async (fromText = false) => {
    if (busy) return;
    setError("");
    try {
      const file = fromText ? null : await pickFile();
      if (!fromText && !file) return;
      setBusy(true);
      abort.current = new AbortController();
      let result: { cv: CV; source: string; type: string };
      if (fromText)
        result = { cv: parseCVText(text), source: text, type: "TEXT" };
      else if (file!.name.toLowerCase().endsWith(".json")) {
        if ((file!.size ?? 0) > 2000000)
          throw Error("Use a JSON backup up to 2 MB.");
        const raw = await readPicked(file!);
        result = {
          cv: importBackup(raw),
          source: raw.slice(0, IMPORT_LIMIT),
          type: "JSON",
        };
      } else if (file!.name.toLowerCase().endsWith(".txt")) {
        const raw = await readPicked(file!);
        result = { cv: parseCVText(raw), source: raw, type: "TXT" };
      } else
        result = await upload(
          state.backendURL,
          accessCode,
          "/api/import",
          file!,
          state.workspace.settings.ocr,
          abort.current.signal,
        );
      if (abort.current.signal.aborted) return;
      const imported = validateCV(result.cv);
      open({
        id: uid(),
        name: (file?.name.replace(/\.[^.]+$/, "") || "Pasted CV").slice(0, 120),
        createdAt: new Date().toISOString(),
        sourceType: result.type,
        source: result.source,
        cv: imported,
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setError((e as Error).message || "Import failed. Please retry.");
    } finally {
      setBusy(false);
    }
  };
  const persist = () => {
    if (!review) throw Error("Nothing to save");
    const saved = {
      ...review,
      name: review.name.trim() || "Imported CV",
      cv: validateCV(review.cv),
    };
    if (
      !state.workspace.imports.some((i) => i.id === saved.id) &&
      state.workspace.imports.length >= 20
    )
      throw Error("Keep up to 20 imports. Remove an older import first.");
    setWorkspace((w) => ({
      ...w,
      imports: [saved, ...w.imports.filter((i) => i.id !== saved.id)],
    }));
    return saved;
  };
  const edit = (next: CV) => setReview((r) => (r ? { ...r, cv: next } : r));
  const entry = (
    sectionId: string,
    entryId: string,
    key: string,
    value: string,
  ) => {
    if (review)
      edit({
        ...review.cv,
        sections: review.cv.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                entries: s.entries.map((e) =>
                  e.id === entryId ? { ...e, [key]: value } : e,
                ),
              }
            : s,
        ),
      });
  };
  return (
    <>
      <Heading
        icon={Upload}
        title="Bring your story with you."
        description="Import once. Review the details. Reuse only what you need."
      />
      {error && (
        <Card style={{ borderColor: t.danger }}>
          <Label size={12} color={t.danger}>
            {error}
          </Label>
        </Card>
      )}
      {!review ? (
        <>
          <Card>
            <Row>
              {[
                { id: "file", label: "Upload a file", Icon: Upload },
                { id: "text", label: "Paste CV text", Icon: FileText },
              ].map(({ id, label, Icon }) => (
                <Button
                  key={id}
                  small
                  icon={Icon}
                  outline={mode !== id}
                  disabled={busy}
                  onPress={() => setMode(id)}
                  style={{ flex: 1 }}
                >
                  {label}
                </Button>
              ))}
            </Row>
            {mode === "file" ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Upload current CV"
                disabled={busy}
                onPress={() => void begin()}
                style={{
                  marginTop: 22,
                  backgroundColor: t.soft,
                  borderColor: t.accent,
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderRadius: 14,
                  padding: 30,
                  alignItems: "center",
                }}
              >
                <Upload size={32} color={t.accent} />
                <Label
                  size={19}
                  bold
                  style={{ textAlign: "center", marginTop: 17 }}
                >
                  Bring your current CV
                </Label>
                <Label size={12} color={t.accent} style={{ marginTop: 8 }}>
                  Tap to choose a file
                </Label>
                <Label
                  size={10}
                  muted
                  style={{ textAlign: "center", marginTop: 13 }}
                >
                  PDF, DOCX, TXT or JSON · up to 10 MB
                </Label>
              </Pressable>
            ) : (
              <>
                <Field
                  label="Your current CV text"
                  multiline
                  value={text}
                  maxLength={IMPORT_LIMIT}
                  style={{ minHeight: 200 }}
                  onChangeText={setText}
                  placeholder="Paste your CV, including section headings such as Education, Experience and Skills."
                />
                <Label size={10} muted>
                  {text.length.toLocaleString()} / 120,000 characters
                </Label>
                <Button
                  icon={ScanText}
                  style={{ marginTop: 14 }}
                  disabled={!text.trim() || busy}
                  onPress={() => void begin(true)}
                >
                  Review imported information
                </Button>
              </>
            )}
            <Toggle
              label="English OCR for scanned PDFs"
              detail="Up to 12 scanned pages; 60 searchable pages."
              value={state.workspace.settings.ocr}
              onChange={(ocr) =>
                setWorkspace((w) => ({
                  ...w,
                  settings: { ...w.settings, ocr },
                }))
              }
            />
            {busy && (
              <>
                <Button loading onPress={() => {}}>
                  Reading your CV…
                </Button>
                <Button subtle onPress={() => abort.current?.abort()}>
                  Cancel
                </Button>
              </>
            )}
            <Label size={11} muted style={{ marginTop: 10 }}>
              PDF/DOCX and OCR use your configured backend. Pasted text, TXT and
              JSON stay on this device. Originals are not retained by the
              backend.
            </Label>
            <Row style={{ marginTop: 16, alignItems: "flex-start" }}>
              <ShieldCheck size={15} color={t.accent} />
              <Label size={10} muted style={{ flex: 1 }}>
                Information is saved separately. Your current CV changes only
                when you choose to apply it.
              </Label>
            </Row>
          </Card>
          <Label size={21} bold style={{ marginTop: 10, marginBottom: 18 }}>
            Your information library
          </Label>
          {!state.workspace.imports.length && (
            <Card style={{ alignItems: "center", paddingVertical: 33 }}>
              <FolderOpen size={32} color={t.accent} />
              <Label size={17} bold style={{ marginTop: 12 }}>
                Room for your next opportunity.
              </Label>
              <Label size={12} muted>
                Your saved information will appear here.
              </Label>
            </Card>
          )}
          {state.workspace.imports.map((i) => (
            <Card key={i.id}>
              <Row>
                <View
                  style={{
                    backgroundColor: t.soft,
                    padding: 13,
                    borderRadius: 11,
                  }}
                >
                  <FileText size={23} color={t.accent} />
                  <Label size={8} color={t.accent} bold>
                    {i.sourceType}
                  </Label>
                </View>
                <View style={{ flex: 1 }}>
                  <Label size={16} bold>
                    {i.name}
                  </Label>
                  <Label size={11} muted>
                    {i.cv.profile.name || "Imported information"} ·{" "}
                    {i.cv.sections.length} sections
                  </Label>
                  <Label size={10} muted>
                    Saved {new Date(i.createdAt).toLocaleDateString()}
                  </Label>
                </View>
                <IconButton
                  danger
                  icon={Trash2}
                  label={`Delete import ${i.name}`}
                  onPress={() => setDeleteId(i.id)}
                />
              </Row>
              <Button outline style={{ marginTop: 18 }} onPress={() => open(i)}>
                Review & use
              </Button>
            </Card>
          ))}
        </>
      ) : (
        <>
          <Row style={{ justifyContent: "space-between", marginBottom: 20 }}>
            <Label size={13} bold color={t.accent}>
              Ready for your review
            </Label>
            <IconButton
              icon={X}
              label="Close import review"
              onPress={() => setReview(null)}
            />
          </Row>
          <Card>
            <Label size={19} bold>
              Check the details first
            </Label>
            <Label size={11} muted style={{ marginVertical: 12 }}>
              Contact fields are detected from the source. Section text is
              preserved. Correct missing fields and split entries as needed.
            </Label>
            <Field
              label="Saved import name"
              value={review.name}
              maxLength={120}
              onChangeText={(name) => setReview({ ...review, name })}
            />
            {profileKeys.map((k) => (
              <Field
                key={k}
                label={profileLabels[k]}
                value={review.cv.profile[k]}
                onChangeText={(value) =>
                  edit({
                    ...review.cv,
                    profile: { ...review.cv.profile, [k]: value },
                  })
                }
              />
            ))}
            <Field
              label="Imported summary"
              multiline
              value={review.cv.summary}
              onChangeText={(summary) => edit({ ...review.cv, summary })}
            />
          </Card>
          {review.cv.sections.map((s) => (
            <Card key={s.id}>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  setExpanded(
                    expanded.includes(s.id)
                      ? expanded.filter((id) => id !== s.id)
                      : [...expanded, s.id],
                  )
                }
              >
                <Row style={{ justifyContent: "space-between" }}>
                  <Label size={16} bold style={{ flex: 1 }}>
                    {s.title}
                  </Label>
                  <Label color={t.accent}>
                    {expanded.includes(s.id) ? "−" : "+"}
                  </Label>
                </Row>
                <Label size={10} muted>
                  {s.entries.length} entries · tap to review
                </Label>
              </Pressable>
              {expanded.includes(s.id) && (
                <>
                  <Field
                    label="Imported section title"
                    value={s.title}
                    maxLength={120}
                    onChangeText={(title) =>
                      edit({
                        ...review.cv,
                        sections: review.cv.sections.map((x) =>
                          x.id === s.id ? { ...x, title } : x,
                        ),
                      })
                    }
                  />
                  {s.entries.map((e, index) => (
                    <View
                      key={e.id}
                      style={{
                        borderTopWidth: 1,
                        borderColor: t.border,
                        paddingTop: 16,
                        marginTop: 18,
                      }}
                    >
                      <Row style={{ justifyContent: "space-between" }}>
                        <Label size={12} bold color={t.accent}>
                          Entry {index + 1}
                        </Label>
                        <IconButton
                          icon={Trash2}
                          danger
                          label={`Remove imported entry ${index + 1}`}
                          onPress={() =>
                            edit({
                              ...review.cv,
                              sections: review.cv.sections.map((x) =>
                                x.id === s.id
                                  ? {
                                      ...x,
                                      entries: x.entries.filter(
                                        (item) => item.id !== e.id,
                                      ),
                                    }
                                  : x,
                              ),
                            })
                          }
                        />
                      </Row>
                      {[
                        ["title", "Title / qualification / role"],
                        ["subtitle", "Organization / institution / authors"],
                        ["date", "Dates"],
                        ["location", "Location"],
                        ["url", "Link"],
                      ].map(([key, label]) => (
                        <Field
                          key={key}
                          label={label}
                          value={e[key as keyof typeof e]}
                          onChangeText={(value) =>
                            entry(s.id, e.id, key, value)
                          }
                        />
                      ))}
                      <Field
                        label="Source text / details"
                        multiline
                        value={e.description}
                        style={{ minHeight: 170 }}
                        onChangeText={(value) =>
                          entry(s.id, e.id, "description", value)
                        }
                      />
                    </View>
                  ))}
                  <Button
                    small
                    outline
                    disabled={s.entries.length >= 100}
                    onPress={() =>
                      edit({
                        ...review.cv,
                        sections: review.cv.sections.map((x) =>
                          x.id === s.id
                            ? { ...x, entries: [...x.entries, emptyEntry()] }
                            : x,
                        ),
                      })
                    }
                  >
                    Add entry
                  </Button>
                </>
              )}
            </Card>
          ))}
          <Card>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSourceOpen(!sourceOpen)}
            >
              <Row>
                <FileText size={17} color={t.accent} />
                <Label size={15} bold>
                  Original source · {review.sourceType}
                </Label>
              </Row>
            </Pressable>
            {sourceOpen && (
              <Label size={12} muted style={{ marginTop: 15 }}>
                {review.source}
              </Label>
            )}
          </Card>
          <Card>
            <Selection cv={review.cv} value={selected} onChange={setSelected} />
            <Button
              icon={FolderOpen}
              style={{ marginTop: 25 }}
              onPress={() => {
                try {
                  persist();
                  setReview(null);
                  notify("Information saved. Your current CV has not changed.");
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Save information only
            </Button>
            <Button
              outline
              style={{ marginTop: 13 }}
              disabled={!selected.length}
              onPress={() => setConfirm(true)}
            >
              Update current CV
            </Button>
          </Card>
        </>
      )}
      <Sheet
        visible={confirm}
        title="Update current CV?"
        description={`Apply selected information to ${cv.label}? Selected personal fields and matching sections will be replaced. You can undo the update.`}
        onClose={() => setConfirm(false)}
      >
        <Row>
          <Button subtle onPress={() => setConfirm(false)}>
            Cancel
          </Button>
          <Button
            onPress={() => {
              try {
                if (review) {
                  const next = buildFromImport(cv, review.cv, selected);
                  persist();
                  commit(next);
                  setConfirm(false);
                  notify(
                    "Selected information applied. Everything is editable.",
                  );
                  onUpdated();
                }
              } catch (e) {
                setError((e as Error).message);
                setConfirm(false);
              }
            }}
          >
            Apply information
          </Button>
        </Row>
      </Sheet>
      <Sheet
        visible={!!deleteId}
        title="Remove this saved import?"
        description="Existing CV drafts will stay unchanged."
        onClose={() => setDeleteId("")}
      >
        <Row>
          <Button subtle onPress={() => setDeleteId("")}>
            Cancel
          </Button>
          <Button
            danger
            onPress={() => {
              setWorkspace((w) => ({
                ...w,
                imports: w.imports.filter((i) => i.id !== deleteId),
              }));
              setDeleteId("");
            }}
          >
            Remove import
          </Button>
        </Row>
      </Sheet>
    </>
  );
}
