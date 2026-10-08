import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { ArrowUpRight, FileText, UserRound, Upload } from "lucide-react-native";
import { useBanao } from "../lib/store";
import { Template, createCV, templates } from "../lib/model";
import { buildFromImport } from "../lib/import-cv";
import { clone } from "../lib/clone";
import { Button, CheckRow, Choice, Label, Row, Sheet } from "./UI";
import { TemplateGrid } from "./Templates";
export function Selection({
  cv,
  value,
  onChange,
}: {
  cv: ReturnType<typeof createCV>;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const options = [
    { id: "profile", label: "Contact & personal information" },
    { id: "summary", label: "Profile / summary" },
    ...cv.sections.map((s) => ({ id: s.id, label: s.title })),
  ];
  return (
    <View style={{ marginTop: 22 }}>
      <Label size={15} bold>
        Choose information to use
      </Label>
      <Row style={{ marginVertical: 7 }}>
        <Button small subtle onPress={() => onChange(options.map((o) => o.id))}>
          Select all
        </Button>
        <Button small subtle onPress={() => onChange([])}>
          Clear selection
        </Button>
      </Row>
      {options.map((o) => (
        <CheckRow
          key={o.id}
          label={o.label}
          checked={value.includes(o.id)}
          onPress={() =>
            onChange(
              value.includes(o.id)
                ? value.filter((i) => i !== o.id)
                : [...value, o.id],
            )
          }
        />
      ))}
    </View>
  );
}
export default function NewCV({
  visible,
  onClose,
  onCreated,
  onImport,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  onImport: () => void;
}) {
  const { state, addDoc, theme: t, notify } = useBanao();
  const [step, setStep] = useState(1),
    [mode, setMode] = useState(
      state.workspace.settings.autoProfile ? "profile" : "blank",
    ),
    [type, setType] = useState<Template>(
      state.workspace.settings.defaultTemplate,
    ),
    [sourceId, setSourceId] = useState(""),
    [selected, setSelected] = useState<string[]>([]);
  const item = state.workspace.imports.find((i) => i.id === sourceId);
  const create = () => {
    try {
      let cv = createCV(type);
      cv.design.font = state.workspace.settings.defaultFont;
      if (mode === "profile") cv.profile = clone(state.workspace.profile);
      if (mode === "import" && item)
        cv = buildFromImport(cv, item.cv, selected);
      cv.label = templates.find((t) => t.id === type)!.category + " CV";
      addDoc(cv);
      onClose();
      onCreated();
      notify("A fresh draft, ready for your next chapter.");
    } catch (e) {
      notify((e as Error).message);
    }
  };
  return (
    <Sheet
      visible={visible}
      title="Make your next move."
      description="Choose your information, then a format. Everything stays editable."
      onClose={onClose}
    >
      <Row style={{ marginBottom: 24 }}>
        <Label size={12} bold color={step === 1 ? t.accent : t.muted}>
          1 · Information
        </Label>
        <Label size={12} bold color={step === 2 ? t.accent : t.muted}>
          2 · Format & create
        </Label>
      </Row>
      {step === 1 ? (
        <>
          <Label size={18} bold>
            How would you like to start?
          </Label>
          {[
            {
              id: "blank",
              name: "Start blank",
              detail: "A clean slate for a new opportunity.",
              Icon: FileText,
            },
            {
              id: "profile",
              name: "Use my profile",
              detail: "Reuse your saved personal and contact details.",
              Icon: UserRound,
            },
            {
              id: "import",
              name: "Use imported information",
              detail: "Choose a saved CV and bring over selected information.",
              Icon: Upload,
            },
          ].map(({ id, name, detail, Icon }) => (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === id }}
              onPress={() => setMode(id)}
              style={{
                borderWidth: 1,
                borderColor: mode === id ? t.accent : t.border,
                backgroundColor: mode === id ? t.soft : t.input,
                padding: 18,
                borderRadius: 13,
                marginTop: 13,
              }}
            >
              <Row>
                <Icon size={21} color={t.accent} />
                <Label size={14} bold>
                  {name}
                </Label>
              </Row>
              <Label size={11} muted style={{ marginTop: 7 }}>
                {detail}
              </Label>
            </Pressable>
          ))}
          {mode === "profile" && (
            <Label size={12} muted style={{ marginTop: 18 }}>
              Using profile:{" "}
              {state.workspace.profile.name || "No profile name saved yet."}
            </Label>
          )}
          {mode === "import" &&
            (state.workspace.imports.length ? (
              <>
                <Choice
                  label="Saved import"
                  value={sourceId}
                  options={state.workspace.imports.map((i) => ({
                    id: i.id,
                    name: i.name,
                  }))}
                  onChange={(id) => {
                    setSourceId(id);
                    const cv = state.workspace.imports.find(
                      (i) => i.id === id,
                    )!.cv;
                    setSelected([
                      "profile",
                      "summary",
                      ...cv.sections
                        .filter(
                          (s) => !s.title.startsWith("Unassigned information"),
                        )
                        .map((s) => s.id),
                    ]);
                  }}
                />
                {item && (
                  <Selection
                    cv={item.cv}
                    value={selected}
                    onChange={setSelected}
                  />
                )}
              </>
            ) : (
              <View style={{ marginTop: 20 }}>
                <Label size={12} muted>
                  No saved imports yet. Import a file or paste your CV text
                  first.
                </Label>
                <Button
                  outline
                  icon={Upload}
                  style={{ marginTop: 12 }}
                  onPress={() => {
                    onClose();
                    onImport();
                  }}
                >
                  Import current CV
                </Button>
              </View>
            ))}
        </>
      ) : (
        <TemplateGrid value={type} onChange={setType} />
      )}
      <Row style={{ marginTop: 25, justifyContent: "space-between" }}>
        <Button subtle onPress={() => (step === 2 ? setStep(1) : onClose())}>
          {step === 2 ? "Back" : "Cancel"}
        </Button>
        <Button
          icon={ArrowUpRight}
          disabled={mode === "import" && (!item || !selected.length)}
          onPress={() => (step === 1 ? setStep(2) : create())}
        >
          {step === 1 ? "Choose a template" : "Create my CV"}
        </Button>
      </Row>
    </Sheet>
  );
}
