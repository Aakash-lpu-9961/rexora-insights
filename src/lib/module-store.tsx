import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiRequest, ApiError } from "./api";
import { useAuth } from "./auth-context";

// ---------- Types ----------
export type Step = { id: string; label: string; done: boolean; detail?: string };
export type Checklist = {
  id: string;
  title: string;
  description: string;
  progress: number;
  steps: Step[];
};
export type PastCase = {
  id: string;
  summary: string;
  rootCause: string;
  resolution: string;
  tags: string[];
  priority: "Critical" | "High" | "Medium" | "Low";
  date: string;
  team: string;
  clientId?: string;
};
export type Contact = {
  id?: number;
  name: string;
  team: string;
  role: string;
  email: string;
  initials: string;
};
export type TR = {
  id: string;
  title: string;
  description: string;
  status: "Open" | "In Review" | "In Progress" | "Done";
  tags: string[];
};
export type DocFile = { id: string; name: string; size: string; updated: string; type: string };
export type VideoFile = { id: string; name: string; duration: string; updated: string };
export type PptFile = { id: string; name: string; size: string; updated: string };
export type Attachments = { documents: DocFile[]; videos: VideoFile[]; ppts: PptFile[] };
export type AIPayload = {
  rootCauses: { label: string; confidence: number }[];
  steps: string[];
  similarCases: { id: string; title: string; tag: string }[];
  finalFix: string;
  notes: string;
};
export type OverviewSection = {
  id: string;
  iconKey: "workflow" | "lightbulb" | "book";
  title: string;
  body: string;
};
export type Overview = {
  tagline: string;
  heroLead: string;
  heroBody: string;
  chips: string[];
  stats: { label: string; value: string; trend: string; tone: "success" | "warning" | "info" }[];
  sections: OverviewSection[];
  featuredVideo: { title: string; duration: string; description: string };
};

export type ModuleData = {
  overview: Overview;
  checklists: Checklist[];
  cases: PastCase[];
  contacts: Contact[];
  tracking: TR[];
  attachments: Attachments;
  chatGreeting: string;
  chatSuggestions: string[];
  loaded: boolean;
};

export type Module = {
  id: string;
  name: string;
  short: string;
  color: string;
  progress: number;
  data: ModuleData;
};

// ---------- Default empty overview ----------
const EMPTY_OVERVIEW: Overview = {
  tagline: "",
  heroLead: "",
  heroBody: "",
  chips: [],
  stats: [],
  sections: [],
  featuredVideo: { title: "", duration: "", description: "" },
};

function emptyData(overview?: Overview, greeting?: string, suggestions?: string[]): ModuleData {
  return {
    overview: overview ?? EMPTY_OVERVIEW,
    checklists: [],
    cases: [],
    contacts: [],
    tracking: [],
    attachments: { documents: [], videos: [], ppts: [] },
    chatGreeting: greeting ?? "",
    chatSuggestions: suggestions ?? [],
    loaded: false,
  };
}

// ---------- API mapping ----------
type ApiModule = {
  id: string;
  name: string;
  short: string;
  color: string;
  progress: number;
  overview: Overview;
  chatGreeting: string;
  chatSuggestions: string[];
};

function apiModuleToModule(m: ApiModule): Module {
  return {
    id: m.id,
    name: m.name,
    short: m.short,
    color: m.color,
    progress: m.progress,
    data: emptyData(m.overview, m.chatGreeting, m.chatSuggestions),
  };
}

// ---------- Context ----------
type StoreShape = {
  modules: Module[];
  selectedId: string;
  selected: Module;
  loading: boolean;
  error: string | null;
  setSelectedId: (id: string) => void;

  addModule: (name: string) => Promise<Module | null>;
  deleteModule: (id: string) => Promise<void>;
  refreshModules: () => Promise<void>;
  refreshActiveModule: () => Promise<void>;

  // Checklists
  createChecklist: (p: {
    title: string;
    description: string;
    steps: Omit<Step, "id">[];
  }) => Promise<void>;
  updateChecklist: (
    checklistId: string,
    patch: Partial<Pick<Checklist, "title" | "description" | "steps">>,
  ) => Promise<void>;
  deleteChecklist: (checklistId: string) => Promise<void>;

  // Cases
  createCase: (p: {
    summary: string;
    rootCause: string;
    resolution: string;
    tags: string[];
    priority: PastCase["priority"];
    date: string;
    team: string;
    clientId?: string;
    id?: string;
  }) => Promise<void>;
  deleteCase: (caseId: string) => Promise<void>;

  // Contacts
  createContact: (p: Omit<Contact, "id" | "initials"> & { initials?: string }) => Promise<void>;
  deleteContact: (contactId: number) => Promise<void>;

  // Tracking requests
  createTR: (p: {
    title: string;
    description: string;
    status?: TR["status"];
    tags?: string[];
    id?: string;
  }) => Promise<void>;
  updateTR: (id: string, patch: Partial<TR>) => Promise<void>;
  deleteTR: (id: string) => Promise<void>;

  // Attachments
  createAttachment: (p: {
    kind: "document" | "video" | "ppt";
    name: string;
    size?: string;
    duration?: string;
    fileType?: string;
    url?: string;
  }) => Promise<void>;
  deleteAttachment: (id: string) => Promise<void>;
};

const ModuleCtx = createContext<StoreShape | null>(null);
const SELECTED_STORAGE_KEY = "rexora.selectedModule.v2";

export function ModuleProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated, initializing } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedId, setSelectedIdState] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dataCache = useRef<Record<string, ModuleData>>({});

  const readSelectedFromStorage = (): string => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem(SELECTED_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  };
  const writeSelectedToStorage = (id: string) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SELECTED_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const fetchModules = useCallback(async (): Promise<Module[]> => {
    if (!token) return [];
    const list = await apiRequest<ApiModule[]>("/api/modules", { token });
    return list.map(apiModuleToModule);
  }, [token]);

  const refreshModules = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchModules();
      setModules((prev) => {
        // Preserve cached .data from previous modules list
        return list.map((m) => {
          const cached = dataCache.current[m.id];
          if (cached) return { ...m, data: cached };
          const prevMod = prev.find((p) => p.id === m.id);
          if (prevMod && prevMod.data.loaded) {
            dataCache.current[m.id] = prevMod.data;
            return { ...m, data: prevMod.data };
          }
          return m;
        });
      });
      if (!list.length) {
        setSelectedIdState("");
        return;
      }
      const stored = readSelectedFromStorage();
      const pick = list.find((m) => m.id === stored)?.id ?? list[0].id;
      setSelectedIdState(pick);
      writeSelectedToStorage(pick);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : ((e as Error)?.message ?? "Failed to load modules");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchModules, token]);

  const loadModuleData = useCallback(
    async (moduleId: string) => {
      if (!token || !moduleId) return;
      try {
        const [checklists, cases, contacts, tracking, attachments] = await Promise.all([
          apiRequest<
            Array<{
              id: string;
              title: string;
              description: string;
              steps: Step[];
              progress: number;
            }>
          >(`/api/modules/${moduleId}/checklists`, { token }),
          apiRequest<
            Array<{
              id: string;
              summary: string;
              root_cause: string;
              resolution: string;
              tags: string[];
              priority: PastCase["priority"];
              case_date: string;
              team: string;
              client_id: string;
            }>
          >(`/api/modules/${moduleId}/cases`, { token }),
          apiRequest<
            Array<{
              id: number;
              name: string;
              team: string;
              role: string;
              email: string;
              initials: string;
            }>
          >(`/api/modules/${moduleId}/contacts`, { token }),
          apiRequest<
            Array<{
              id: string;
              title: string;
              description: string;
              status: TR["status"];
              tags: string[];
            }>
          >(`/api/modules/${moduleId}/tracking`, { token }),
          apiRequest<
            Array<{
              id: string;
              kind: "document" | "video" | "ppt";
              name: string;
              size: string;
              duration: string;
              file_type: string;
              updated: string;
            }>
          >(`/api/modules/${moduleId}/attachments`, { token }),
        ]);

        setModules((prev) =>
          prev.map((m) => {
            if (m.id !== moduleId) return m;
            const att: Attachments = {
              documents: attachments
                .filter((a) => a.kind === "document")
                .map((a) => ({
                  id: a.id,
                  name: a.name,
                  size: a.size,
                  updated: a.updated,
                  type: a.file_type || "FILE",
                })),
              videos: attachments
                .filter((a) => a.kind === "video")
                .map((a) => ({
                  id: a.id,
                  name: a.name,
                  duration: a.duration,
                  updated: a.updated,
                })),
              ppts: attachments
                .filter((a) => a.kind === "ppt")
                .map((a) => ({
                  id: a.id,
                  name: a.name,
                  size: a.size,
                  updated: a.updated,
                })),
            };
            const nextData: ModuleData = {
              ...m.data,
              checklists: checklists.map((c) => ({
                id: c.id,
                title: c.title,
                description: c.description,
                progress: c.progress,
                steps: c.steps ?? [],
              })),
              cases: cases.map((c) => ({
                id: c.id,
                summary: c.summary,
                rootCause: c.root_cause,
                resolution: c.resolution,
                tags: c.tags ?? [],
                priority: c.priority,
                date: c.case_date,
                team: c.team,
                clientId: c.client_id,
              })),
              contacts: contacts.map((c) => ({
                id: c.id,
                name: c.name,
                team: c.team,
                role: c.role,
                email: c.email,
                initials: c.initials,
              })),
              tracking: tracking.map((t) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                tags: t.tags ?? [],
              })),
              attachments: att,
              loaded: true,
            };
            dataCache.current[moduleId] = nextData;
            return { ...m, data: nextData };
          }),
        );
      } catch (e) {
        const msg =
          e instanceof ApiError
            ? e.message
            : ((e as Error)?.message ?? "Failed to load module data");
        setError(msg);
      }
    },
    [token],
  );

  // Initial load + re-load on auth change
  useEffect(() => {
    if (initializing) return;
    if (!isAuthenticated) {
      setModules([]);
      setSelectedIdState("");
      dataCache.current = {};
      return;
    }
    void refreshModules();
  }, [initializing, isAuthenticated, refreshModules]);

  // Load data for active module when selection changes
  useEffect(() => {
    if (!selectedId) return;
    const current = modules.find((m) => m.id === selectedId);
    if (!current || current.data.loaded) return;
    void loadModuleData(selectedId);
  }, [selectedId, modules, loadModuleData]);

  const selected = useMemo(() => {
    const m = modules.find((x) => x.id === selectedId);
    return m ?? modules[0] ?? placeholderModule();
  }, [modules, selectedId]);

  const setSelectedId = useCallback((id: string) => {
    setSelectedIdState(id);
    writeSelectedToStorage(id);
  }, []);

  const refreshActiveModule = useCallback(async () => {
    if (selectedId) await loadModuleData(selectedId);
  }, [selectedId, loadModuleData]);

  // ---------- Mutations ----------
  const addModule = useCallback(
    async (name: string): Promise<Module | null> => {
      const trimmed = name.trim();
      if (!trimmed || !token) return null;
      const created = await apiRequest<ApiModule>("/api/modules", {
        method: "POST",
        body: {
          name: trimmed,
          overview: EMPTY_OVERVIEW,
          chatGreeting: `Hi — I'm Rexora AI for ${trimmed}. Describe your issue and I'll triage it.`,
          chatSuggestions: [
            `What are the most common ${trimmed} issues?`,
            `Draft a triage checklist for ${trimmed}.`,
          ],
        },
        token,
      });
      const mod = apiModuleToModule(created);
      setModules((prev) => [...prev, mod]);
      setSelectedId(mod.id);
      return mod;
    },
    [setSelectedId, token],
  );

  const deleteModule = useCallback(
    async (id: string) => {
      if (!token) return;
      await apiRequest(`/api/modules/${id}`, { method: "DELETE", token });
      delete dataCache.current[id];
      setModules((prev) => {
        const next = prev.filter((m) => m.id !== id);
        if (id === selectedId) {
          const pick = next[0]?.id ?? "";
          setSelectedIdState(pick);
          writeSelectedToStorage(pick);
        }
        return next;
      });
    },
    [selectedId, token],
  );

  const createChecklist = useCallback<StoreShape["createChecklist"]>(
    async ({ title, description, steps }) => {
      if (!token || !selectedId) return;
      const withIds = steps.map((s, i) => ({ ...s, id: `s${i}-${Date.now()}` }));
      await apiRequest(`/api/modules/${selectedId}/checklists`, {
        method: "POST",
        body: { title, description, steps: withIds },
        token,
      });
      await loadModuleData(selectedId);
    },
    [selectedId, token, loadModuleData],
  );

  const updateChecklist = useCallback<StoreShape["updateChecklist"]>(
    async (checklistId, patch) => {
      if (!token || !selectedId) return;
      await apiRequest(`/api/modules/${selectedId}/checklists/${checklistId}`, {
        method: "PATCH",
        body: patch,
        token,
      });
      await loadModuleData(selectedId);
    },
    [selectedId, token, loadModuleData],
  );

  const deleteChecklist = useCallback<StoreShape["deleteChecklist"]>(
    async (checklistId) => {
      if (!token || !selectedId) return;
      await apiRequest(`/api/modules/${selectedId}/checklists/${checklistId}`, {
        method: "DELETE",
        token,
      });
      await loadModuleData(selectedId);
    },
    [selectedId, token, loadModuleData],
  );

  const createCase = useCallback<StoreShape["createCase"]>(
    async (p) => {
      if (!token || !selectedId) return;
      await apiRequest(`/api/modules/${selectedId}/cases`, {
        method: "POST",
        body: {
          id: p.id,
          summary: p.summary,
          root_cause: p.rootCause,
          resolution: p.resolution,
          tags: p.tags,
          priority: p.priority,
          case_date: p.date,
          team: p.team,
          client_id: p.clientId ?? "",
        },
        token,
      });
      await loadModuleData(selectedId);
    },
    [selectedId, token, loadModuleData],
  );

  const deleteCase = useCallback<StoreShape["deleteCase"]>(
    async (caseId) => {
      if (!token || !selectedId) return;
      await apiRequest(`/api/modules/${selectedId}/cases/${caseId}`, { method: "DELETE", token });
      await loadModuleData(selectedId);
    },
    [selectedId, token, loadModuleData],
  );

  const createContact = useCallback<StoreShape["createContact"]>(
    async (p) => {
      if (!token || !selectedId) return;
      await apiRequest(`/api/modules/${selectedId}/contacts`, {
        method: "POST",
        body: { ...p, initials: p.initials ?? "" },
        token,
      });
      await loadModuleData(selectedId);
    },
    [selectedId, token, loadModuleData],
  );

  const deleteContact = useCallback<StoreShape["deleteContact"]>(
    async (contactId) => {
      if (!token || !selectedId) return;
      await apiRequest(`/api/modules/${selectedId}/contacts/${contactId}`, {
        method: "DELETE",
        token,
      });
      await loadModuleData(selectedId);
    },
    [selectedId, token, loadModuleData],
  );

  const createTR = useCallback<StoreShape["createTR"]>(
    async (p) => {
      if (!token || !selectedId) return;
      await apiRequest(`/api/modules/${selectedId}/tracking`, {
        method: "POST",
        body: { ...p, status: p.status ?? "Open", tags: p.tags ?? [] },
        token,
      });
      await loadModuleData(selectedId);
    },
    [selectedId, token, loadModuleData],
  );

  const updateTR = useCallback<StoreShape["updateTR"]>(
    async (id, patch) => {
      if (!token || !selectedId) return;
      await apiRequest(`/api/modules/${selectedId}/tracking/${id}`, {
        method: "PATCH",
        body: patch,
        token,
      });
      await loadModuleData(selectedId);
    },
    [selectedId, token, loadModuleData],
  );

  const deleteTR = useCallback<StoreShape["deleteTR"]>(
    async (id) => {
      if (!token || !selectedId) return;
      await apiRequest(`/api/modules/${selectedId}/tracking/${id}`, { method: "DELETE", token });
      await loadModuleData(selectedId);
    },
    [selectedId, token, loadModuleData],
  );

  const createAttachment = useCallback<StoreShape["createAttachment"]>(
    async (p) => {
      if (!token || !selectedId) return;
      await apiRequest(`/api/modules/${selectedId}/attachments`, {
        method: "POST",
        body: {
          kind: p.kind,
          name: p.name,
          size: p.size ?? "",
          duration: p.duration ?? "",
          file_type: p.fileType ?? "",
          url: p.url ?? "",
          updated: new Date().toISOString().slice(0, 10),
        },
        token,
      });
      await loadModuleData(selectedId);
    },
    [selectedId, token, loadModuleData],
  );

  const deleteAttachment = useCallback<StoreShape["deleteAttachment"]>(
    async (id) => {
      if (!token || !selectedId) return;
      await apiRequest(`/api/modules/${selectedId}/attachments/${id}`, { method: "DELETE", token });
      await loadModuleData(selectedId);
    },
    [selectedId, token, loadModuleData],
  );

  const value: StoreShape = useMemo(
    () => ({
      modules,
      selectedId,
      selected,
      loading,
      error,
      setSelectedId,
      addModule,
      deleteModule,
      refreshModules,
      refreshActiveModule,
      createChecklist,
      updateChecklist,
      deleteChecklist,
      createCase,
      deleteCase,
      createContact,
      deleteContact,
      createTR,
      updateTR,
      deleteTR,
      createAttachment,
      deleteAttachment,
    }),
    [
      modules,
      selectedId,
      selected,
      loading,
      error,
      setSelectedId,
      addModule,
      deleteModule,
      refreshModules,
      refreshActiveModule,
      createChecklist,
      updateChecklist,
      deleteChecklist,
      createCase,
      deleteCase,
      createContact,
      deleteContact,
      createTR,
      updateTR,
      deleteTR,
      createAttachment,
      deleteAttachment,
    ],
  );

  return <ModuleCtx.Provider value={value}>{children}</ModuleCtx.Provider>;
}

function placeholderModule(): Module {
  return {
    id: "",
    name: "No module",
    short: "—",
    color: "oklch(0.55 0.2 278)",
    progress: 0,
    data: emptyData(),
  };
}

export function useModuleStore(): StoreShape {
  const ctx = useContext(ModuleCtx);
  if (!ctx) throw new Error("useModuleStore must be used inside <ModuleProvider>");
  return ctx;
}

export function useActiveModule(): Module {
  const { selected } = useModuleStore();
  return selected;
}
