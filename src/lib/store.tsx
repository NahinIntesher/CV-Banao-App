import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState, Platform, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { CV, createCV, uid, validateCV } from "./model";
import { Workspace, defaultWorkspace, validateWorkspace } from "./workspace";
import { clone } from "./clone";
import { makeTheme } from "./theme";
export type State = {
  version: 1;
  docs: CV[];
  active: string;
  workspace: Workspace;
  appearance: "light" | "dark" | "system";
  backendURL: string;
};
const KEY = "cv-banao.mobile.v1",
  CODE_KEY = "cv-banao.access-code";
const initial = (): State => {
  const cv = createCV();
  cv.label = "My first CV";
  cv.profile.name = "Nahin Intesher";
  return {
    version: 1,
    docs: [cv],
    active: cv.id,
    workspace: defaultWorkspace(),
    appearance: "system",
    backendURL: "",
  };
};
export function validateState(raw: unknown): State {
  const s = raw as State;
  if (
    !s ||
    s.version !== 1 ||
    !Array.isArray(s.docs) ||
    !s.docs.length ||
    s.docs.length > 50 ||
    typeof s.active !== "string" ||
    !["light", "dark", "system"].includes(s.appearance) ||
    typeof s.backendURL !== "string" ||
    s.backendURL.length > 2000
  )
    throw new Error("Invalid saved app data");
  const docs = s.docs.map(validateCV);
  if (new Set(docs.map((c) => c.id)).size !== docs.length)
    throw new Error("Duplicate draft ids");
  return { ...s, docs, workspace: validateWorkspace(s.workspace) };
}
function useAppStore() {
  const [state, setState] = useState<State>(initial),
    [ready, setReady] = useState(false),
    [status, setStatus] = useState("Loading…"),
    [toast, setToast] = useState(""),
    [accessCode, setCode] = useState(""),
    [historyVersion, setHV] = useState({ undo: false, redo: false });
  const [savedState, setSavedState] = useState<State | null>(null);
  const system = useColorScheme();
  const past = useRef<CV[]>([]),
    future = useRef<CV[]>([]);
  const cv = state.docs.find((c) => c.id === state.active) ?? state.docs[0];
  const latest = useRef(state);
  useLayoutEffect(() => {
    latest.current = state;
  }, [state]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw && alive) setState(validateState(JSON.parse(raw)));
        if (Platform.OS !== "web") {
          const code = await SecureStore.getItemAsync(CODE_KEY);
          if (code && alive) setCode(code);
        }
      } catch {
        if (alive)
          setToast(
            "Saved data could not be loaded. Restore a workspace backup.",
          );
        try {
          const raw = await AsyncStorage.getItem(KEY);
          if (raw) await AsyncStorage.setItem(KEY + ".recovery", raw);
        } catch {}
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  const save = async (s: State) => {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(s));
      setSavedState(s);
      setStatus("Saved on this device");
    } catch {
      setSavedState(s);
      setStatus("Not saved · export a backup");
    }
  };
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => void save(state), 450);
    return () => clearTimeout(timer);
  }, [state, ready]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active" && ready) void save(latest.current);
    });
    return () => sub.remove();
  }, [ready]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const commit = (next: CV) => {
    past.current = [...past.current.slice(-49), clone(cv)];
    future.current = [];
    setHV({ undo: past.current.length > 0, redo: future.current.length > 0 });
    setState((s) => ({
      ...s,
      docs: s.docs.map((d) =>
        d.id === cv.id ? { ...next, updatedAt: new Date().toISOString() } : d,
      ),
    }));
  };
  const patch = (part: Partial<CV>) => commit({ ...cv, ...part });
  const select = (id: string) => {
    setState((s) => ({ ...s, active: id }));
    past.current = [];
    future.current = [];
    setHV({ undo: past.current.length > 0, redo: future.current.length > 0 });
  };
  const undo = () => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(clone(cv));
    setState((s) => ({
      ...s,
      docs: s.docs.map((d) => (d.id === cv.id ? prev : d)),
    }));
    setHV({ undo: past.current.length > 0, redo: future.current.length > 0 });
  };
  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(clone(cv));
    setState((s) => ({
      ...s,
      docs: s.docs.map((d) => (d.id === cv.id ? next : d)),
    }));
    setHV({ undo: past.current.length > 0, redo: future.current.length > 0 });
  };
  const addDoc = (next: CV) => {
    if (state.docs.length >= 50)
      throw new Error("Keep up to 50 drafts. Remove an older draft first.");
    setState((s) => ({ ...s, docs: [...s.docs, next], active: next.id }));
    past.current = [];
    future.current = [];
    setHV({ undo: past.current.length > 0, redo: future.current.length > 0 });
  };
  const duplicate = (id: string) => {
    const source = state.docs.find((c) => c.id === id);
    if (!source) return;
    const copy = clone(source);
    copy.id = uid();
    copy.label = copy.label.slice(0, 110) + " (copy)";
    copy.updatedAt = new Date().toISOString();
    addDoc(copy);
  };
  const deleteDoc = (id: string) => {
    setState((s) => {
      const docs = s.docs.filter((c) => c.id !== id);
      if (!docs.length) docs.push(createCV());
      return { ...s, docs, active: s.active === id ? docs[0].id : s.active };
    });
    past.current = [];
    future.current = [];
    setHV({ undo: false, redo: false });
  };
  const setWorkspace = (w: Workspace | ((w: Workspace) => Workspace)) =>
    setState((s) => ({
      ...s,
      workspace: typeof w === "function" ? w(s.workspace) : w,
    }));
  const saveCode = async (code: string) => {
    if (Platform.OS !== "web") {
      if (code) await SecureStore.setItemAsync(CODE_KEY, code);
      else await SecureStore.deleteItemAsync(CODE_KEY);
    }
    setCode(code);
  };
  const restore = (workspace: Workspace, docs: CV[]) => {
    setState((s) => ({ ...s, workspace, docs, active: docs[0].id }));
    past.current = [];
    future.current = [];
    setHV({ undo: past.current.length > 0, redo: future.current.length > 0 });
  };
  const reset = () => {
    const blank = createCV();
    restore(defaultWorkspace(), [blank]);
    setState((s) => ({ ...s, backendURL: "", appearance: "system" }));
    void saveCode("");
  };
  const theme = makeTheme(
    state.workspace.settings.color,
    state.appearance === "dark" ||
      (state.appearance === "system" && system === "dark"),
  );
  return {
    state,
    setState,
    cv,
    ready,
    status: ready && savedState !== state ? "Saving…" : status,
    toast,
    notify: setToast,
    theme,
    commit,
    patch,
    select,
    undo,
    redo,
    canUndo: historyVersion.undo,
    canRedo: historyVersion.redo,
    historyVersion,
    addDoc,
    duplicate,
    deleteDoc,
    setWorkspace,
    accessCode,
    saveCode,
    restore,
    reset,
  };
}
type Store = ReturnType<typeof useAppStore>;
const Context = createContext<Store | null>(null);
export function Provider({ children }: { children: ReactNode }) {
  const store = useAppStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useBanao() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing app provider");
  return value;
}
