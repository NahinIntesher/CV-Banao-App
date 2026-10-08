import React, { useEffect, useState } from "react";
import { Slot, router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  BookOpen,
  Download,
  Edit3,
  FileText,
  Home,
  LayoutTemplate,
  Menu,
  Moon,
  Palette,
  Plus,
  Settings2,
  Sun,
  Upload,
  UserRound,
  X,
} from "lucide-react-native";
import { Provider, useBanao } from "./src/lib/store";
import { appFonts } from "./src/lib/app-fonts";
import { exportCV } from "./src/lib/files";
import {
  Brand,
  Button,
  IconButton,
  Label,
  Row,
  Sheet,
} from "./src/components/UI";
import HomeScreen from "./src/screens/Home";
import Imports from "./src/screens/Imports";
import Profile from "./src/screens/Profile";
import Settings from "./src/screens/Settings";
import Editor from "./src/screens/Editor";
import Research from "./src/screens/Research";
import NewCV from "./src/components/NewCV";
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error)
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 30,
            backgroundColor: "#f8f9fb",
          }}
        >
          <LabelFallback />
        </View>
      );
    return this.props.children;
  }
}
function LabelFallback() {
  return (
    <View>
      <Text style={{ fontSize: 24, fontWeight: "700", color: "#262b36" }}>
        CV Banao needs a restart.
      </Text>
      <Text
        style={{
          fontSize: 15,
          lineHeight: 24,
          color: "#687080",
          marginTop: 14,
        }}
      >
        Close and reopen the app. Your saved workspace is kept separately. If
        the problem continues, restore a workspace backup after restarting.
      </Text>
    </View>
  );
}
export function Application() {
  const {
    state,
    setState,
    cv,
    ready,
    status,
    toast,
    notify,
    theme: t,
    select,
  } = useBanao();
  const params = useLocalSearchParams<{ page?: string }>();
  const screen = [
    "home",
    "imports",
    "editor",
    "templates",
    "design",
    "research",
    "account",
    "settings",
  ].includes(params.page ?? "")
    ? params.page!
    : "home";
  const [nav, setNav] = useState(false),
    [newOpen, setNewOpen] = useState(false),
    [exportOpen, setExportOpen] = useState(false),
    [exportBusy, setExportBusy] = useState(false),
    [appearanceOpen, setAppearanceOpen] = useState(false);
  const { width } = useWindowDimensions();
  const editor = ["editor", "templates", "design"].includes(screen);
  const navigate = (id: string) => {
    router.replace({ pathname: "/[page]", params: { page: id } });
    setNav(false);
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (screen !== "home") {
        navigate("home");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [screen]);
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: t.bg,
        }}
      >
        <Brand size={52} />
        <Label size={27} bold style={{ marginTop: 20 }}>
          CV Banao
        </Label>
        <ActivityIndicator color={t.accent} style={{ marginTop: 22 }} />
      </View>
    );
  const save = async (format: "pdf" | "json" | "txt") => {
    setExportBusy(true);
    try {
      await exportCV(cv, format);
      notify(
        format === "pdf"
          ? "Your professional PDF is ready."
          : "Backup/export is ready.",
      );
      setExportOpen(false);
    } catch (e) {
      notify((e as Error).message || "Export failed. Please try again.");
    } finally {
      setExportBusy(false);
    }
  };
  const tabs = [
    { id: "home", label: "Home", Icon: Home },
    { id: "imports", label: "Import", Icon: Upload },
    { id: "editor", label: "Build CV", Icon: Edit3 },
    { id: "account", label: "Profile", Icon: UserRound },
    { id: "settings", label: "Settings", Icon: Settings2 },
  ];
  const routes = [
    { id: "home", label: "My workspace", Icon: Home },
    { id: "imports", label: "Import current CV", Icon: Upload },
    { id: "editor", label: "Edit current CV", Icon: Edit3 },
    { id: "templates", label: "Templates · 20", Icon: LayoutTemplate },
    { id: "design", label: "Design & layout", Icon: Palette },
    { id: "research", label: "Research PDFs", Icon: BookOpen },
    { id: "account", label: "My profile", Icon: UserRound },
    { id: "settings", label: "Settings", Icon: Settings2 },
  ];
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: t.card }}
      edges={["top", "bottom"]}
    >
      <StatusBar style={t.dark ? "light" : "dark"} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            paddingHorizontal: width < 360 ? 8 : 13,
            height: 67,
            borderBottomWidth: 1,
            borderColor: t.border,
            backgroundColor: t.card,
            flexDirection: "row",
            alignItems: "center",
            gap: width < 360 ? 2 : 6,
          }}
        >
          <IconButton
            icon={Menu}
            label="Open navigation"
            onPress={() => setNav(true)}
          />
          <Row style={{ gap: 6, flex: 1 }}>
            <Brand size={width < 360 ? 26 : 30} />
            <Label size={width < 360 ? 16 : 18} bold>
              CV Banao
            </Label>
          </Row>
          <IconButton
            icon={t.dark ? Moon : Sun}
            label="Change appearance"
            onPress={() => setAppearanceOpen(true)}
          />
          {width < 360 ? (
            <IconButton
              icon={Download}
              label="Export CV"
              onPress={() => setExportOpen(true)}
            />
          ) : (
            <Button small icon={Download} onPress={() => setExportOpen(true)}>
              Export CV
            </Button>
          )}
        </View>
        {editor ? (
          <View style={{ flex: 1, backgroundColor: t.bg }}>
            <Editor key={screen + cv.id} screen={screen} />
          </View>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            style={{ flex: 1, backgroundColor: t.bg }}
            contentContainerStyle={{
              padding: width > 700 ? 32 : 19,
              paddingBottom: 30,
              maxWidth: 940,
              width: "100%",
              alignSelf: "center",
            }}
          >
            {screen === "home" && (
              <HomeScreen
                onNew={() => setNewOpen(true)}
                onImport={() => navigate("imports")}
                onEdit={(id) => {
                  select(id);
                  navigate("editor");
                }}
              />
            )}
            {screen === "imports" && (
              <Imports onUpdated={() => navigate("editor")} />
            )}
            {screen === "account" && <Profile onNew={() => setNewOpen(true)} />}
            {screen === "settings" && <Settings />}
            {screen === "research" && <Research />}
          </ScrollView>
        )}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 7,
            borderTopWidth: 1,
            borderColor: t.border,
            backgroundColor: t.card,
          }}
        >
          <Label size={9} muted>
            {status} · {cv.label}
          </Label>
        </View>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: t.card,
            borderTopWidth: 1,
            borderColor: t.border,
            paddingTop: 8,
            paddingBottom: 5,
          }}
        >
          {tabs.map(({ id, label, Icon }) => {
            const active = screen === id || (id === "editor" && editor);
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
                onPress={() => navigate(id)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 5,
                  gap: 5,
                  minHeight: 48,
                }}
              >
                <View
                  style={{
                    backgroundColor: active ? t.soft : "transparent",
                    paddingVertical: 5,
                    paddingHorizontal: 13,
                    borderRadius: 10,
                  }}
                >
                  <Icon size={21} color={active ? t.accent : t.muted} />
                </View>
                <Label
                  size={9}
                  bold={active}
                  color={active ? t.accent : t.muted}
                >
                  {label}
                </Label>
              </Pressable>
            );
          })}
        </View>
        {!!toast && (
          <Pressable
            accessibilityRole="alert"
            onPress={() => notify("")}
            style={{
              position: "absolute",
              bottom: 91,
              left: 18,
              right: 18,
              padding: 16,
              backgroundColor: t.card,
              borderColor: t.border,
              borderWidth: 1,
              borderRadius: 13,
              shadowColor: "#000",
              shadowOpacity: 0.12,
              shadowRadius: 15,
              elevation: 7,
            }}
          >
            <Row>
              <Label size={12} style={{ flex: 1 }}>
                {toast}
              </Label>
              <X size={15} color={t.muted} />
            </Row>
          </Pressable>
        )}
        {newOpen && (
          <NewCV
            visible={newOpen}
            onClose={() => setNewOpen(false)}
            onCreated={() => navigate("editor")}
            onImport={() => navigate("imports")}
          />
        )}
        <Sheet
          visible={nav}
          title="Your workspace"
          description="Your story. Your next step."
          onClose={() => setNav(false)}
        >
          {routes.map(({ id, label, Icon }) => (
            <Button
              key={id}
              subtle
              icon={Icon}
              style={{
                justifyContent: "flex-start",
                marginBottom: 8,
                backgroundColor: screen === id ? t.soft : "transparent",
              }}
              onPress={() => navigate(id)}
            >
              {label}
            </Button>
          ))}
          <Button
            icon={Plus}
            style={{ marginTop: 15 }}
            onPress={() => {
              setNav(false);
              setNewOpen(true);
            }}
          >
            Create a new CV
          </Button>
        </Sheet>
        <Sheet
          visible={appearanceOpen}
          title="Appearance"
          onClose={() => setAppearanceOpen(false)}
        >
          {(["light", "dark", "system"] as const).map((mode) => (
            <Button
              key={mode}
              outline
              style={{ marginBottom: 13 }}
              onPress={() => {
                setState((s) => ({ ...s, appearance: mode }));
                setAppearanceOpen(false);
              }}
            >
              {mode[0].toUpperCase() + mode.slice(1)}
              {state.appearance === mode ? " · selected" : ""}
            </Button>
          ))}
        </Sheet>
        <Sheet
          visible={exportOpen}
          title="Ready for your next chapter?"
          description="Your current CV, in the format you need. No watermark."
          onClose={() => {
            if (!exportBusy) setExportOpen(false);
          }}
        >
          <Label size={16} bold>
            {cv.label}
          </Label>
          <Label size={12} muted style={{ marginTop: 6, marginBottom: 24 }}>
            {cv.profile.name || "Add your name before submitting."}
          </Label>
          <Button
            icon={Download}
            loading={exportBusy}
            onPress={() => void save("pdf")}
          >
            Share professional PDF
          </Button>
          <Button
            outline
            icon={FileText}
            disabled={exportBusy}
            style={{ marginTop: 13 }}
            onPress={() => void save("json")}
          >
            Editable JSON backup
          </Button>
          <Button
            outline
            icon={FileText}
            disabled={exportBusy}
            style={{ marginTop: 13 }}
            onPress={() => void save("txt")}
          >
            Plain text export
          </Button>
          <Label size={10} muted style={{ marginTop: 20 }}>
            Only completed, visible sections are exported. Review your PDF
            before submitting.
          </Label>
        </Sheet>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export default function App() {
  const [loaded, error] = useFonts(appFonts);
  if (!loaded && !error)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: "#f8f9fb",
        }}
      >
        <ActivityIndicator color="#7155d9" />
      </View>
    );
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <Provider>
          <Slot />
        </Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
