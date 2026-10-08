import React, { useState } from "react";
import { View, ScrollView, Pressable, useWindowDimensions } from "react-native";
import {
  ArrowDown,
  ArrowUp,
  BriefcaseBusiness,
  BookOpen,
  Check,
  GraduationCap,
  LayoutTemplate,
  Palette,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  UserRound,
} from "lucide-react-native";
import { useBanao } from "../lib/store";
import {
  CV,
  Entry,
  Kind,
  Section,
  colors,
  createSection,
  emptyEntry,
  fonts,
  templates,
} from "../lib/model";
import { profileKeys, profileLabels } from "../lib/import-cv";
import {
  Button,
  Card,
  Choice,
  Field,
  Heading,
  IconButton,
  Label,
  Row,
  Sheet,
  Toggle,
} from "../components/UI";
import { TemplateGrid } from "../components/Templates";
import DocumentPreview from "../components/DocumentPreview";
export default function Editor({ screen }: { screen: string }) {
  const {
    cv,
    theme: t,
    patch,
    undo,
    redo,
    canUndo,
    canRedo,
    notify,
  } = useBanao();
  const [accentEdit, setAccentEdit] = useState({
    base: cv.design.accent,
    draft: cv.design.accent,
  });
  const accentDraft =
    accentEdit.base === cv.design.accent ? accentEdit.draft : cv.design.accent;
  const [panel, setPanel] = useState(
      screen === "templates"
        ? "templates"
        : screen === "design"
          ? "design"
          : "profile",
    ),
    [preview, setPreview] = useState(false),
    [sectionModal, setSectionModal] = useState(false),
    [sectionName, setSectionName] = useState(""),
    [kind, setKind] = useState<Kind>("experience"),
    [filter, setFilter] = useState("All"),
    [query, setQuery] = useState(""),
    [remove, setRemove] = useState<(() => void) | null>(null);
  const { width } = useWindowDimensions();
  const section = cv.sections.find((s) => s.id === panel);
  const changeSection = (id: string, part: Partial<Section>) =>
    patch({
      sections: cv.sections.map((s) => (s.id === id ? { ...s, ...part } : s)),
    });
  const design = (key: keyof CV["design"], value: unknown) =>
    patch({ design: { ...cv.design, [key]: value } });
  const entry = (id: string, part: Partial<Entry>) => {
    if (section)
      changeSection(section.id, {
        entries: section.entries.map((e) =>
          e.id === id ? { ...e, ...part } : e,
        ),
      });
  };
  const reorder = (list: any[], from: number, to: number) => {
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };
  const chips = [
    { id: "profile", label: "Personal details" },
    { id: "templates", label: "Templates" },
    { id: "design", label: "Design & layout" },
    ...cv.sections.map((s) => ({ id: s.id, label: s.title })),
  ];
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: 12,
          backgroundColor: t.card,
          borderBottomWidth: 1,
          borderColor: t.border,
        }}
      >
        <Row>
          <View style={{ flex: 1, flexDirection: "row", gap: 5 }}>
            {["Edit your CV", "Live preview"].map((label, i) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityState={{ selected: preview === !!i }}
                onPress={() => setPreview(!!i)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 13,
                  borderRadius: 9,
                  backgroundColor: preview === !!i ? t.soft : "transparent",
                }}
              >
                <Label
                  size={12}
                  bold
                  color={preview === !!i ? t.accent : t.muted}
                >
                  {label}
                </Label>
              </Pressable>
            ))}
          </View>
          <IconButton
            icon={Undo2}
            label="Undo"
            onPress={undo}
            disabled={!canUndo}
          />
          <IconButton
            icon={Redo2}
            label="Redo"
            onPress={redo}
            disabled={!canRedo}
          />
        </Row>
        {!preview && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 10 }}
            contentContainerStyle={{ gap: 7, paddingBottom: 13 }}
          >
            {chips.map((c) => (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                onPress={() => setPanel(c.id)}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 9,
                  borderWidth: 1,
                  borderColor: panel === c.id ? t.accent : t.border,
                  backgroundColor: panel === c.id ? t.soft : t.input,
                  borderRadius: 8,
                }}
              >
                <Label
                  size={11}
                  bold
                  color={panel === c.id ? t.accent : t.muted}
                >
                  {c.label}
                </Label>
              </Pressable>
            ))}
            <Button
              small
              subtle
              icon={Plus}
              onPress={() => setSectionModal(true)}
            >
              Section
            </Button>
          </ScrollView>
        )}
      </View>
      {preview ? (
        <View style={{ flex: 1, padding: 14 }}>
          <DocumentPreview cv={cv} />
          <Label size={9} muted style={{ textAlign: "center", marginTop: 9 }}>
            Continuous preview · PDF export adds page breaks
          </Label>
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: width > 700 ? 30 : 19,
            paddingBottom: 40,
            maxWidth: 900,
            width: "100%",
            alignSelf: "center",
          }}
        >
          {panel === "profile" && (
            <>
              <Heading
                icon={UserRound}
                title="Let’s start with you."
                description="The essentials that help someone reach you. Your story comes next."
                eyebrow="A GREAT FIRST IMPRESSION"
              />
              <Card>
                <Label size={14} bold>
                  Personal details
                </Label>
                {profileKeys.map((k) => (
                  <Field
                    key={k}
                    label={profileLabels[k]}
                    value={cv.profile[k]}
                    maxLength={2000}
                    keyboardType={
                      k === "email"
                        ? "email-address"
                        : k === "phone"
                          ? "phone-pad"
                          : "default"
                    }
                    autoCapitalize={
                      ["email", "website", "linkedin", "scholar"].includes(k)
                        ? "none"
                        : "sentences"
                    }
                    placeholder={
                      k === "name"
                        ? "Your full name"
                        : k === "headline"
                          ? "e.g. Researcher in computational biology"
                          : ""
                    }
                    onChangeText={(value) =>
                      patch({ profile: { ...cv.profile, [k]: value } })
                    }
                  />
                ))}
              </Card>
              <Card>
                <Label size={14} bold>
                  Your profile or objective
                </Label>
                <Field
                  label="Professional summary"
                  multiline
                  value={cv.summary}
                  onChangeText={(summary) => patch({ summary })}
                  placeholder="What do you do, what interests you, and what do you want to contribute?"
                />
              </Card>
              <Field
                label="Document name"
                value={cv.label}
                maxLength={120}
                onChangeText={(label) => patch({ label })}
              />
              <Button
                icon={GraduationCap}
                onPress={() =>
                  setPanel(
                    cv.sections.find((s) => s.kind === "education")?.id ||
                      "design",
                  )
                }
              >
                Continue to education
              </Button>
            </>
          )}
          {panel === "templates" && (
            <>
              <Heading
                icon={LayoutTemplate}
                title="A format for your next step."
                description="Twenty carefully considered templates. Every detail is yours to change."
              />
              <Field
                label="Search templates"
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name or purpose…"
              />
              <Choice
                label="Template category"
                value={filter}
                options={[
                  "All",
                  "Academic",
                  "Research",
                  "PhD / Higher study",
                  "Industry",
                ].map((id) => ({ id, name: id }))}
                onChange={setFilter}
              />
              <View style={{ marginTop: 25 }}>
                <TemplateGrid
                  value={cv.template}
                  filter={filter}
                  query={query}
                  onChange={(id) => {
                    const item = templates.find((t) => t.id === id)!;
                    patch({
                      template: id,
                      design: {
                        ...cv.design,
                        font: item.font,
                        accent: item.color,
                      },
                    });
                    notify("Template applied. Your content stays intact.");
                  }}
                />
              </View>
              <Card style={{ backgroundColor: t.soft }}>
                <Label size={19} bold>
                  {templates.find((x) => x.id === cv.template)?.name}
                </Label>
                <Label size={12} muted style={{ marginTop: 9 }}>
                  {templates.find((x) => x.id === cv.template)?.description}
                </Label>
              </Card>
            </>
          )}
          {panel === "design" && (
            <>
              <Heading
                icon={Palette}
                title="Make it feel like you."
                description="Thoughtful typography. Just the right color. A little space to let your work breathe."
              />
              <Card>
                <Label size={15} bold>
                  Typography
                </Label>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    marginTop: 17,
                  }}
                >
                  {fonts.map((f) => (
                    <Pressable
                      key={f.id}
                      accessibilityRole="button"
                      accessibilityLabel={`CV font ${f.name}`}
                      accessibilityState={{ selected: cv.design.font === f.id }}
                      onPress={() => design("font", f.id)}
                      style={{
                        width: "48%",
                        padding: 13,
                        minHeight: 65,
                        borderRadius: 10,
                        marginBottom: 11,
                        borderWidth: 1,
                        borderColor:
                          cv.design.font === f.id ? t.accent : t.border,
                        backgroundColor:
                          cv.design.font === f.id ? t.soft : t.input,
                      }}
                    >
                      <Label
                        size={23}
                        color={t.accent}
                        style={{ fontFamily: f.family }}
                      >
                        Aa
                      </Label>
                      <Label size={10}>{f.name}</Label>
                    </Pressable>
                  ))}
                </View>
                <Choice
                  label="Body size"
                  value={String(cv.design.fontSize)}
                  options={[
                    8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14,
                  ].map((n) => ({ id: String(n), name: n + " pt" }))}
                  onChange={(v) => design("fontSize", Number(v))}
                />
                <Choice
                  label="Line height"
                  value={String(cv.design.lineHeight)}
                  options={[1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8].map(
                    (n) => ({ id: String(n), name: n.toFixed(1) }),
                  )}
                  onChange={(v) => design("lineHeight", Number(v))}
                />
              </Card>
              <Card>
                <Label size={15} bold>
                  CV colors
                </Label>
                <Row wrap style={{ marginTop: 18, marginBottom: 10 }}>
                  {colors.map((color) => (
                    <Pressable
                      key={color}
                      accessibilityRole="button"
                      accessibilityLabel={`CV accent ${color}`}
                      onPress={() => design("accent", color)}
                      style={{
                        backgroundColor: color,
                        width: 34,
                        height: 34,
                        borderRadius: 18,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: cv.design.accent === color ? 3 : 0,
                        borderColor: t.text,
                      }}
                    >
                      {cv.design.accent === color && (
                        <Check color="#fff" size={16} />
                      )}
                    </Pressable>
                  ))}
                </Row>
                <Field
                  label="Custom accent color"
                  value={accentDraft}
                  maxLength={7}
                  autoCapitalize="none"
                  onChangeText={(value) => {
                    const valid = /^#[0-9a-f]{6}$/i.test(value);
                    setAccentEdit({
                      base: valid ? value : cv.design.accent,
                      draft: value,
                    });
                    if (valid) design("accent", value);
                  }}
                  hint="Use a six-digit hex color, e.g. #315C9B"
                />
                <Choice
                  label="Body text color"
                  value={cv.design.textColor}
                  options={[
                    "#202633",
                    "#1f2937",
                    "#334155",
                    "#333333",
                    "#000000",
                  ].map((id) => ({ id, name: id }))}
                  onChange={(v) => design("textColor", v)}
                />
              </Card>
              <Card>
                <Label size={15} bold>
                  Page & spacing
                </Label>
                <Choice
                  label="Paper size"
                  value={cv.design.paper}
                  options={[
                    { id: "A4", name: "A4" },
                    { id: "LETTER", name: "US Letter" },
                  ]}
                  onChange={(v) => design("paper", v)}
                />
                <Choice
                  label="Margins"
                  value={String(cv.design.margins)}
                  options={[24, 28, 32, 36, 40, 42, 44, 48, 52, 56, 60, 64].map(
                    (n) => ({ id: String(n), name: n + " pt" }),
                  )}
                  onChange={(v) => design("margins", Number(v))}
                />
                <Choice
                  label="Section spacing"
                  value={String(cv.design.spacing)}
                  options={[8, 10, 12, 14, 16, 18, 20, 22, 24].map((n) => ({
                    id: String(n),
                    name: n + " pt",
                  }))}
                  onChange={(v) => design("spacing", Number(v))}
                />
                <Toggle
                  label="Page numbers"
                  value={cv.design.pageNumbers}
                  onChange={(v) => design("pageNumbers", v)}
                  detail="Native print support varies by platform. Check the exported PDF."
                />
              </Card>
            </>
          )}
          {section && (
            <>
              <Heading
                title={section.title}
                description="Add the details that matter to this opportunity. Keep your contribution specific."
                icon={
                  section.kind === "education"
                    ? GraduationCap
                    : section.kind === "publications"
                      ? BookOpen
                      : BriefcaseBusiness
                }
              />
              <Card>
                <Field
                  label="Section title"
                  value={section.title}
                  maxLength={120}
                  onChangeText={(title) => changeSection(section.id, { title })}
                />
                <Toggle
                  label="Include this section in CV"
                  value={section.visible}
                  onChange={(visible) => changeSection(section.id, { visible })}
                />
                <Row>
                  <Button
                    small
                    outline
                    icon={ArrowUp}
                    disabled={cv.sections.indexOf(section) === 0}
                    onPress={() =>
                      patch({
                        sections: reorder(
                          cv.sections,
                          cv.sections.indexOf(section),
                          cv.sections.indexOf(section) - 1,
                        ),
                      })
                    }
                  >
                    Up
                  </Button>
                  <Button
                    small
                    outline
                    icon={ArrowDown}
                    disabled={
                      cv.sections.indexOf(section) === cv.sections.length - 1
                    }
                    onPress={() =>
                      patch({
                        sections: reorder(
                          cv.sections,
                          cv.sections.indexOf(section),
                          cv.sections.indexOf(section) + 1,
                        ),
                      })
                    }
                  >
                    Down
                  </Button>
                  <IconButton
                    danger
                    icon={Trash2}
                    label="Remove section"
                    onPress={() =>
                      setRemove(() => () => {
                        patch({
                          sections: cv.sections.filter(
                            (s) => s.id !== section.id,
                          ),
                        });
                        setPanel("profile");
                      })
                    }
                  />
                </Row>
              </Card>
              {section.entries.map((e, i) => (
                <Card key={e.id}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <Label size={12} bold color={t.accent}>
                      ENTRY {String(i + 1).padStart(2, "0")}
                    </Label>
                    <Row>
                      <IconButton
                        icon={ArrowUp}
                        label={`Move entry ${i + 1} up`}
                        disabled={i === 0}
                        onPress={() =>
                          changeSection(section.id, {
                            entries: reorder(section.entries, i, i - 1),
                          })
                        }
                      />
                      <IconButton
                        icon={ArrowDown}
                        label={`Move entry ${i + 1} down`}
                        disabled={i === section.entries.length - 1}
                        onPress={() =>
                          changeSection(section.id, {
                            entries: reorder(section.entries, i, i + 1),
                          })
                        }
                      />
                      <IconButton
                        danger
                        icon={Trash2}
                        label={`Remove entry ${i + 1}`}
                        onPress={() =>
                          setRemove(
                            () => () =>
                              changeSection(section.id, {
                                entries: section.entries.filter(
                                  (x) => x.id !== e.id,
                                ),
                              }),
                          )
                        }
                      />
                    </Row>
                  </Row>
                  {section.kind !== "text" && (
                    <>
                      <Field
                        label={
                          section.kind === "education"
                            ? "Degree / qualification"
                            : section.kind === "publications"
                              ? "Publication title"
                              : section.kind === "skills"
                                ? "Skill category"
                                : "Role / title"
                        }
                        value={e.title}
                        onChangeText={(title) => entry(e.id, { title })}
                      />
                      {section.kind !== "skills" && (
                        <>
                          <Field
                            label={
                              section.kind === "education"
                                ? "Institution"
                                : section.kind === "publications"
                                  ? "Authors / venue"
                                  : "Organization"
                            }
                            value={e.subtitle}
                            onChangeText={(subtitle) =>
                              entry(e.id, { subtitle })
                            }
                          />
                          <Field
                            label="Dates"
                            value={e.date}
                            onChangeText={(date) => entry(e.id, { date })}
                          />
                          <Field
                            label="Location"
                            value={e.location}
                            onChangeText={(location) =>
                              entry(e.id, { location })
                            }
                          />
                          <Field
                            label="Link"
                            autoCapitalize="none"
                            value={e.url}
                            onChangeText={(url) => entry(e.id, { url })}
                          />
                        </>
                      )}
                    </>
                  )}
                  <Field
                    label={
                      section.kind === "skills"
                        ? "Skills"
                        : "Details & achievements"
                    }
                    value={e.description}
                    multiline
                    onChangeText={(description) => entry(e.id, { description })}
                    placeholder="Use a new line for each point. Start bullet lines with - "
                  />
                </Card>
              ))}
              <Button
                outline
                icon={Plus}
                disabled={section.entries.length >= 100}
                onPress={() =>
                  changeSection(section.id, {
                    entries: [...section.entries, emptyEntry()],
                  })
                }
              >
                Add another entry
              </Button>
            </>
          )}
        </ScrollView>
      )}
      <Sheet
        visible={sectionModal}
        title="Make room for more."
        description="Add a section that matters to your application."
        onClose={() => setSectionModal(false)}
      >
        <Field
          label="New section name"
          value={sectionName}
          onChangeText={setSectionName}
          maxLength={120}
          placeholder="e.g. Volunteer experience"
        />
        <Choice
          label="Content format"
          value={kind}
          options={[
            { id: "experience", name: "Experience" },
            { id: "education", name: "Education" },
            { id: "publications", name: "Publication" },
            { id: "skills", name: "Skills" },
            { id: "text", name: "Free text" },
          ]}
          onChange={(v) => setKind(v as Kind)}
        />
        <Button
          icon={Plus}
          style={{ marginTop: 22 }}
          disabled={!sectionName.trim() || cv.sections.length >= 40}
          onPress={() => {
            const next = createSection(sectionName.trim(), kind);
            patch({ sections: [...cv.sections, next] });
            setPanel(next.id);
            setSectionName("");
            setSectionModal(false);
          }}
        >
          Add section
        </Button>
      </Sheet>
      <Sheet
        visible={!!remove}
        title="Remove this content?"
        description="You can undo this change during the current editing session."
        onClose={() => setRemove(null)}
      >
        <Row>
          <Button subtle onPress={() => setRemove(null)}>
            Cancel
          </Button>
          <Button
            danger
            onPress={() => {
              remove?.();
              setRemove(null);
            }}
          >
            Remove
          </Button>
        </Row>
      </Sheet>
    </View>
  );
}
