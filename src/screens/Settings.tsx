import React, { useState } from "react";
import { Pressable, View } from "react-native";
import {
  Check,
  Download,
  Palette,
  Settings2,
  ShieldCheck,
  Upload,
  Wifi,
} from "lucide-react-native";
import { useBanao } from "../lib/store";
import {
  Workspace,
  workspaceColors,
  readWorkspaceBackup,
} from "../lib/workspace";
import { CV, fonts, templates } from "../lib/model";
import { pickFile, readPicked, shareText } from "../lib/files";
import { apiURL } from "../lib/api";
import {
  Button,
  Card,
  Choice,
  Field,
  Heading,
  Label,
  Row,
  Sheet,
  Toggle,
} from "../components/UI";
export default function Settings() {
  const {
    state,
    setState,
    setWorkspace,
    theme: t,
    accessCode,
    saveCode,
    restore,
    reset,
    notify,
  } = useBanao();
  const [code, setCode] = useState(accessCode),
    [checking, setChecking] = useState(false),
    [pending, setPending] = useState<{
      workspace: Workspace;
      docs: CV[];
    } | null>(null),
    [clear, setClear] = useState(false);
  const w = state.workspace;
  const backup = async () => {
    try {
      await shareText(
        JSON.stringify(
          {
            format: "cv-banao-workspace",
            version: 1,
            workspace: w,
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
  const restoreFile = async () => {
    try {
      const file = await pickFile();
      if (!file) return;
      if (!file.name.endsWith(".json"))
        throw Error("Choose a JSON workspace backup.");
      setPending(readWorkspaceBackup(await readPicked(file)));
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const check = async () => {
    setChecking(true);
    try {
      await saveCode(code);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      let response;
      try {
        response = await fetch(apiURL(state.backendURL) + "/api/status", {
          signal: controller.signal,
          headers: { "x-cv-access-code": code },
        });
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok) {
        const failure = await response.json();
        throw Error(
          failure.error || "The backend is not responding correctly.",
        );
      }
      const data = await response.json();
      if (data.service !== "CV Banao mobile API")
        throw Error("This URL does not point to the mobile backend.");
      notify(
        data.aiConfigured
          ? "Connected. Research AI is configured."
          : "Connected. File import is ready; research AI needs a server API key.",
      );
    } catch (e) {
      notify(
        (e as Error).name === "AbortError"
          ? "Connection timed out. Check Wi-Fi and the backend address."
          : (e as Error).message,
      );
    } finally {
      setChecking(false);
    }
  };
  return (
    <>
      <Heading
        icon={Settings2}
        title="Your workspace. Your way."
        description="Choose your appearance, defaults and data preferences."
      />
      <Card>
        <Row>
          <Palette size={21} color={t.accent} />
          <Label size={18} bold>
            Workspace palette
          </Label>
        </Row>
        <Label size={12} muted style={{ marginTop: 10, marginBottom: 20 }}>
          Pairs with Light, Dark or System mode. CV document colors stay
          independent.
        </Label>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {workspaceColors.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={c.name}
              accessibilityState={{ selected: w.settings.color === c.id }}
              onPress={() =>
                setWorkspace((x) => ({
                  ...x,
                  settings: { ...x.settings, color: c.id },
                }))
              }
              style={{
                width: "48%",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: w.settings.color === c.id ? t.accent : t.border,
                backgroundColor: t.input,
                borderRadius: 11,
                marginBottom: 11,
              }}
            >
              <View
                style={{
                  backgroundColor: c.color,
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {w.settings.color === c.id && <Check size={16} color="#fff" />}
              </View>
              <Label size={10} bold style={{ flex: 1 }}>
                {c.name}
              </Label>
            </Pressable>
          ))}
        </View>
        <Choice
          label="Appearance"
          value={state.appearance}
          options={["light", "dark", "system"].map((id) => ({
            id,
            name: id[0].toUpperCase() + id.slice(1),
          }))}
          onChange={(appearance) =>
            setState((s) => ({ ...s, appearance: appearance as any }))
          }
        />
      </Card>
      <Card>
        <Label size={18} bold>
          New CV defaults
        </Label>
        <Choice
          label="Default template"
          value={w.settings.defaultTemplate}
          options={templates.map((t) => ({
            id: t.id,
            name: t.name + " · " + t.category,
          }))}
          onChange={(id) =>
            setWorkspace((x) => ({
              ...x,
              settings: { ...x.settings, defaultTemplate: id as any },
            }))
          }
        />
        <Choice
          label="Default CV font"
          value={w.settings.defaultFont}
          options={fonts.map((f) => ({ id: f.id, name: f.name }))}
          onChange={(id) =>
            setWorkspace((x) => ({
              ...x,
              settings: { ...x.settings, defaultFont: id as any },
            }))
          }
        />
        <Toggle
          label="Use my profile by default"
          detail="Choose Blank or Imported information in the creation flow whenever you prefer."
          value={w.settings.autoProfile}
          onChange={(autoProfile) =>
            setWorkspace((x) => ({
              ...x,
              settings: { ...x.settings, autoProfile },
            }))
          }
        />
        <Toggle
          label="English OCR for scanned CVs"
          value={w.settings.ocr}
          onChange={(ocr) =>
            setWorkspace((x) => ({ ...x, settings: { ...x.settings, ocr } }))
          }
        />
      </Card>
      <Card>
        <Row>
          <Wifi size={20} color={t.accent} />
          <Label size={18} bold>
            Import & research connection
          </Label>
        </Row>
        <Label size={11} muted style={{ marginTop: 12 }}>
          PDF/DOCX and OCR use the included backend. Use its HTTPS address, or
          your computer’s LAN IP while testing on the same Wi-Fi. API keys stay
          on the server.
        </Label>
        <Field
          label="Backend URL"
          value={state.backendURL}
          autoCapitalize="none"
          keyboardType="url"
          placeholder="http://192.168.1.10:4000"
          onChangeText={(backendURL) => setState((s) => ({ ...s, backendURL }))}
        />
        <Field
          label="Workspace access code"
          value={code}
          onChangeText={setCode}
          secureTextEntry
          autoCapitalize="none"
          hint="Saved in device secure storage. Excluded from backups."
        />
        <Button
          outline
          loading={checking}
          icon={Wifi}
          onPress={() => void check()}
        >
          Save & test connection
        </Button>
        <Button
          subtle
          onPress={() =>
            void saveCode(code)
              .then(() => notify("Access code saved securely."))
              .catch(() => notify("Could not save the access code."))
          }
        >
          Save access code
        </Button>
      </Card>
      <Card>
        <Row>
          <ShieldCheck size={20} color={t.accent} />
          <Label size={18} bold>
            Backups & data
          </Label>
        </Row>
        <Label size={12} muted style={{ marginTop: 11, marginBottom: 20 }}>
          Profile, imports and drafts are saved on this device. Workspace JSON
          backups are compatible with the web app.
        </Label>
        <Button icon={Download} onPress={() => void backup()}>
          Export workspace backup
        </Button>
        <Button
          outline
          icon={Upload}
          style={{ marginTop: 12 }}
          onPress={() => void restoreFile()}
        >
          Restore workspace backup
        </Button>
        <Label size={10} muted style={{ marginTop: 15 }}>
          Restoring replaces current profile, imports and drafts. No cloud sync
          or account is required.
        </Label>
        <Button danger style={{ marginTop: 24 }} onPress={() => setClear(true)}>
          Reset workspace data
        </Button>
      </Card>
      <Sheet
        visible={!!pending}
        title="Restore this workspace?"
        description={`Replace your local workspace with ${pending?.docs.length ?? 0} drafts and ${pending?.workspace.imports.length ?? 0} saved imports? Export a backup first if you want to keep both.`}
        onClose={() => setPending(null)}
      >
        <Row>
          <Button subtle onPress={() => setPending(null)}>
            Cancel
          </Button>
          <Button
            onPress={() => {
              if (pending) {
                restore(pending.workspace, pending.docs);
                setPending(null);
                notify("Workspace restored.");
              }
            }}
          >
            Restore workspace
          </Button>
        </Row>
      </Sheet>
      <Sheet
        visible={clear}
        title="Delete local workspace data?"
        description="This removes profile, saved imports and drafts from this device. Download a workspace backup first."
        onClose={() => setClear(false)}
      >
        <Row>
          <Button subtle onPress={() => setClear(false)}>
            Cancel
          </Button>
          <Button
            danger
            onPress={() => {
              reset();
              setCode("");
              setClear(false);
              notify("Workspace reset. A blank CV is ready.");
            }}
          >
            Delete & reset
          </Button>
        </Row>
      </Sheet>
    </>
  );
}
