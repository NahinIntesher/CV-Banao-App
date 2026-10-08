import React, { useState } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import {
  ArrowUpRight,
  Download,
  FileText,
  FolderOpen,
  LayoutTemplate,
  Palette,
  Plus,
  ShieldCheck,
  Trash2,
  Copy,
  Upload,
} from "lucide-react-native";
import { useBanao } from "../lib/store";
import { templates } from "../lib/model";
import { shareText } from "../lib/files";
import {
  Button,
  Card,
  Field,
  IconButton,
  Label,
  Row,
  Sheet,
} from "../components/UI";
export default function Home({
  onNew,
  onImport,
  onEdit,
}: {
  onNew: () => void;
  onImport: () => void;
  onEdit: (id: string) => void;
}) {
  const { state, theme: t, duplicate, deleteDoc, notify } = useBanao();
  const [query, setQuery] = useState(""),
    [remove, setRemove] = useState("");
  const { width } = useWindowDimensions();
  const backup = async () => {
    try {
      await shareText(
        JSON.stringify(
          {
            format: "cv-banao-workspace",
            version: 1,
            workspace: state.workspace,
            docs: state.docs,
          },
          null,
          2,
        ),
        "cv-banao-workspace.json",
      );
    } catch (e) {
      notify((e as Error).message);
    }
  };
  return (
    <>
      <Card style={{ backgroundColor: t.soft, padding: 24, marginTop: 3 }}>
        <Label size={9} bold color={t.accent} style={{ letterSpacing: 1.8 }}>
          MADE FOR YOUR NEXT MOVE
        </Label>
        <Label
          size={width < 360 ? 28 : 32}
          bold
          style={{ lineHeight: 41, letterSpacing: -1, marginTop: 20 }}
        >
          Your experience.{"\n"}A stronger first impression.
        </Label>
        <Label size={13} muted style={{ marginTop: 16, marginBottom: 23 }}>
          Build a CV that feels like you. Bring your existing information,
          choose a format, and make every detail count.
        </Label>
        <Button icon={Plus} onPress={onNew} style={{ alignSelf: "flex-start" }}>
          Create a new CV
        </Button>
        <Button
          icon={Upload}
          outline
          onPress={onImport}
          style={{ alignSelf: "flex-start", marginTop: 10 }}
        >
          Import an existing CV
        </Button>
      </Card>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 0,
          marginBottom: 13,
        }}
      >
        {[
          [String(state.docs.length), "CV drafts", FileText],
          [String(state.workspace.imports.length), "Saved imports", FolderOpen],
          ["20", "Purposeful templates", LayoutTemplate],
          ["10", "Professional fonts", Palette],
        ].map(([count, label, Icon]) => {
          const I = Icon as typeof FileText;
          return (
            <Card
              key={String(label)}
              style={{
                width: width > 700 ? "23.5%" : "48%",
                padding: 17,
                marginBottom: 13,
              }}
            >
              <Row>
                <I size={20} color={t.accent} />
                <Label size={23} bold>
                  {String(count)}
                </Label>
              </Row>
              <Label size={11} muted style={{ marginTop: 5 }}>
                {String(label)}
              </Label>
            </Card>
          );
        })}
      </View>
      <Label size={21} bold>
        Your CV workspace
      </Label>
      <Label size={12} muted style={{ marginTop: 4 }}>
        Continue editing, or create a version for a new opportunity.
      </Label>
      <Field
        label="Find a draft"
        placeholder="Search your CVs…"
        value={query}
        onChangeText={setQuery}
      />
      {state.docs
        .filter((d) =>
          [d.label, d.profile.name]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .map((d) => (
          <Card key={d.id} style={{ padding: 21 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${d.label}`}
              onPress={() => onEdit(d.id)}
            >
              <Row
                style={{ justifyContent: "space-between", marginBottom: 19 }}
              >
                <View
                  style={{
                    width: 42,
                    height: 46,
                    borderRadius: 10,
                    backgroundColor: d.design.accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText size={23} color="#fff" />
                </View>
                <Label size={10} muted>
                  {templates.find((x) => x.id === d.template)?.category}
                </Label>
              </Row>
              <Label size={18} bold>
                {d.label}
              </Label>
              <Label size={12} muted style={{ marginTop: 4 }}>
                {d.profile.name || "Add your details"}
              </Label>
              <Row style={{ justifyContent: "space-between", marginTop: 19 }}>
                <Label size={10} muted>
                  Updated {new Date(d.updatedAt).toLocaleDateString()}
                </Label>
                <Row>
                  <Label size={12} bold color={t.accent}>
                    Edit CV
                  </Label>
                  <ArrowUpRight size={15} color={t.accent} />
                </Row>
              </Row>
            </Pressable>
            <Row
              style={{
                justifyContent: "flex-end",
                borderTopWidth: 1,
                borderColor: t.border,
                marginTop: 15,
                paddingTop: 7,
              }}
            >
              <IconButton
                icon={Copy}
                label={`Duplicate ${d.label}`}
                onPress={() => {
                  try {
                    duplicate(d.id);
                    notify("Draft duplicated");
                  } catch (e) {
                    notify((e as Error).message);
                  }
                }}
              />
              <IconButton
                icon={Trash2}
                label={`Delete ${d.label}`}
                danger
                onPress={() => setRemove(d.id)}
              />
            </Row>
          </Card>
        ))}
      <Pressable
        accessibilityRole="button"
        onPress={onNew}
        style={{
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: t.border,
          borderRadius: 16,
          padding: 27,
          alignItems: "center",
          marginBottom: 22,
        }}
      >
        <Plus size={27} color={t.accent} />
        <Label size={17} bold style={{ marginTop: 14 }}>
          A new opportunity
        </Label>
        <Label size={12} muted>
          Start your next CV
        </Label>
      </Pressable>
      <Card style={{ backgroundColor: t.soft }}>
        <Row>
          <ShieldCheck size={22} color={t.accent} />
          <Label size={13} bold>
            Your work, on your device.
          </Label>
        </Row>
        <Label size={11} muted style={{ marginTop: 9, marginBottom: 15 }}>
          Download a workspace backup to carry your profile, saved imports and
          drafts with you.
        </Label>
        <Button outline icon={Download} onPress={() => void backup()}>
          Back up workspace
        </Button>
      </Card>
      <Sheet
        visible={!!remove}
        title="Remove this draft?"
        description="Download a backup first if you want to keep it. This action cannot be undone."
        onClose={() => setRemove("")}
      >
        <Row>
          <Button subtle onPress={() => setRemove("")}>
            Cancel
          </Button>
          <Button
            danger
            icon={Trash2}
            onPress={() => {
              deleteDoc(remove);
              setRemove("");
              notify("Draft removed");
            }}
          >
            Remove draft
          </Button>
        </Row>
      </Sheet>
    </>
  );
}
